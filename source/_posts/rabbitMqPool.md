title: RabbitMQ channel连接池
tags:
  - rabbitMq
  - 连接池
categories:
  - rabbitMq
date: 2019-05-01 01:00:00
---
## 为什么使用MQ
- **应用解耦**：可以让不同的应用之间能够通过消息队列实现共同协作处理业务
- **流量销峰**：秒杀活动中，可能会因为瞬间的流量过大，导致应用挂掉，为了解决这个问题，可以引入消息队列来平滑的过度流量，保护后端的应用。
---

## rabbitMq简介
### **Connection**
- **ConnectionFactory** 是Connection的创建工厂，我们需要Connection的时候，是通过ConnectionFactory获取的；
- **Connection** 是RabbitMQ的socket链接，它封装了socket协议相关部分逻辑，
- **Channel** 通过Connection对象创建的AMQP 信道（Channel），一个Connection可以创建多个Channel，每一个Channel都会被指派一个唯一的ID，**<span style="color:#FF4040"> rabbitmq的每一条指令都是通过Channel来完成的 </span>**，每个Channel代表一个会话任务。

### **Broker**
- **Exchange**：消息交换机，它指定消息按什么规则，路由到哪个队列
- **Queue**：消息队列载体，每个消息都会被投入到一个或多个队列
- **Routing Key**：路由关键字，exchange根据这个关键字进行消息投递。
- **vhost**：虚拟主机，一个broker里可以开设多个vhost，用作不同用户的权限分离

### **交换机的类型**
- **Direct交换机**：直连交换机，完全更具key进行投递。
- **Topic交换机**：在key进行模式匹配后进行投递，例如符号”#”匹配一个或多个字符，符号”*”匹配一串连续的字母字符
- **Fanout交换机**：它采取广播模式，消息进来时，将会被投递到与改交换机绑定的所有队列中

---
## **rabbitMQ连接池**实现
> - 对于connection，channel对象创建时间长，创建时需要消耗大量的资源，且对象创建后可被重复使用，如同数据库库连接池一样，当我们的业务并发量很大的时候，频繁的创建，关闭连接是一项非常损耗系统资源的操作，我们需要将这些对象缓存起来以便重复利用，减少系统开销，提升系统性能。
- RabbitMQ的指令都是通过channel的来实现的，且channel是可以复用的，所以该对象池中存储的也是channel对象。
### 获取配置信息
```Java
public class RabbitMqConfig {
    /**
     * @desc 用户名
     */
    @Value("${rabbitmq.username:guest}")
    private String username;
    /**
     * @desc 密码
     */
    @Value("${rabbitmq.password:guest}")
    private String password;
    /**
     * @desc 连接串
     */
    private Address[] address;
    /**
     * @desc vhost
     */
    @Value("${rabbitmq.vhost:/}")
    private String vhost;
    /**
     * @desc 对象总数
     */
    @Value("${rabbitmq.maxTotal:8}")
    private Integer maxTotal;
    /**
     * @desc 最大空闲对象数
     */
    @Value("${rabbitmq.maxIdle:8}")
    private Integer maxIdle;
    /**
     * @desc 最小空闲对象书
     */
    @Value("${rabbitmq.minIdle:0}")
    private Integer minIdle;
    /**
     * @desc 获取超时时间
     */
    @Value("${rabbitmq.maxWaitMillis:1000}")
    private Integer maxWaitMillis;
    //此处可能省略set get
	  /**
     * 解析配置参数
     */
    @PostConstruct
    public void initAddress() {
        String connetionString = environment.getProperty("rabbitmq.connectionString", "127.0.0.1:5672");
        if (StringUtils.isEmpty(connetionString)) {
            throw new UnknownFormatConversionException("非法的配置参数");
        }
        String[] arrays = connetionString.split(Constant.COMMA);
        this.address = new Address[arrays.length];
        for (int i = 0; i < arrays.length; i++) {
            String[] addressArray = arrays[i].split(":");
            address[i] = new Address(addressArray[0], Integer.valueOf(addressArray[1]));
        }
    }
}

```

### rabbitMQ channel 对象工厂
> BasePooledObjectFactory是池对象工厂，用于管理池对象的生命周期，我们只需要继承他，并覆并覆写父类相关方法即可控制池对象的生成、初始化、反初始化、校验等;我们在使用对象池的时候，一般是需要基于BasePooledObjectFactory创建我们自己的对象工厂  

```Java
@Component
public class RabbitMqChannelFactory extends BasePooledObjectFactory<Channel> {
    public static final Logger loggr = LoggerFactory.getLogger(RabbitMqChannelFactory.class);
    @Autowired
    private RabbitMqConfig config;
    private ConnectionFactory factory;
    private Connection conn;
    private int i = 0;
    @Override
    public PooledObject<Channel> makeObject() throws Exception {
        return super.makeObject();
    }

    @Override
    public void destroyObject(PooledObject<Channel> p) throws Exception {
        super.destroyObject(p);
    }

    @Override
    public boolean validateObject(PooledObject<Channel> p) {
        return p.getObject().isOpen();
    }


    @Override
    public void activateObject(PooledObject<Channel> p) throws Exception {
        super.activateObject(p);
    }

    /**
     * 使用完返还对象时
     * @param p
     * @throws Exception
     */
    @Override
    public void passivateObject(PooledObject<Channel> p) throws Exception {
        super.passivateObject(p);
    }

    /**
     * 创建一个新对象
     * @return
     * @throws Exception
     */
    @Override
    public Channel create() throws Exception {
        loggr.info("create channel:{}",i);
        Channel channel = conn.createChannel();
        channel.confirmSelect();
        i++;
        return channel;
    }
    /**
     * 封装为池化对象
     * @param channel
     * @throws Exception
     */
    @Override
    public PooledObject<Channel> wrap(Channel channel) {
        return new DefaultPooledObject<>(channel);
    }
    @PostConstruct
    private void init(){
        factory = new ConnectionFactory();
        factory.setConnectionTimeout(5000);
        factory.setVirtualHost(config.getVhost());
        //自动重连
        factory.setAutomaticRecoveryEnabled(true);
        factory.setUsername(config.getUsername());
        factory.setPassword(config.getPassword());
        try {
            conn = factory.newConnection(config.getAddress());
        } catch (Exception e) {
            loggr.error("rabbitmq create connection error", e);
            throw new RuntimeException("rabbitmq create connection error");
        }
    }

```

`create()`核心方法，表明我们对象池中的对象是如何创建的。

### 构建rabbit channel pool
```Java
public class RabbitChannelPool extends GenericObjectPool<Channel> {

    public RabbitChannelPool(PooledObjectFactory<Channel> factory, GenericObjectPoolConfig<Channel> config) {
        super(factory, config);
    }
}

```



GenericObjectPool是Apache Commons Pool实现的一个通用泛型对象池，是一个对象池的完整实现，我们直接构建并使用即可。
### 初始化channel对象池
```Java
@PostConstruct
public void initPool(){
    GenericObjectPoolConfig config = new GenericObjectPoolConfig();
    config.setMinIdle(mqConfig.getMinIdle());
    config.setMaxTotal(mqConfig.getMaxTotal());
    config.setMaxIdle(mqConfig.getMaxIdle());
    config.setMaxWaitMillis(2000);
    rabbitChannelPool = new RabbitChannelPool(rabbitMqChannelFactory, config);
}
```

> 构建`GenericObjectPoolConfig`对象配置我们的参数，然后创建RabbitChannelPool对象，我们就可以直接通过RabbitChannelPool对象来池中获取和归还channel对象了。  

### 封装rabbitMqService 服务提供消息的发送和监听

```Java
@Service("rabbitMqService")
public class RabbitMqServiceImpl implements RabbitMqService{
    public static final Logger logger = LoggerFactory.getLogger(RabbitMqServiceImpl.class);
    private RabbitChannelPool rabbitChannelPool;
    @Autowired
    private RabbitMqChannelFactory rabbitMqChannelFactory;
    @Autowired
    private RabbitMqConfig mqConfig;
    public static final String UTF_8 = "utf-8";

    @PostConstruct
    public void initPool(){
        GenericObjectPoolConfig config = new GenericObjectPoolConfig();
        config.setMinIdle(mqConfig.getMinIdle());
        config.setMaxTotal(mqConfig.getMaxTotal());
        config.setMaxIdle(mqConfig.getMaxIdle());
        config.setMaxWaitMillis(2000);
        rabbitChannelPool = new RabbitChannelPool(rabbitMqChannelFactory, config);
    }

    @Override
    public void sendMessage() {

    }

    @Override
    public boolean sendMessage(String queueName, String exchange, String routingKey, String extype, String message) {
        Channel channel = null;
        try {
            channel = rabbitChannelPool.borrowObject();
            logger.info("active:{},Idle:{}",rabbitChannelPool.getNumActive(),rabbitChannelPool.getNumIdle());
            //声明队列(durable -> true,持久化，)
            channel.queueDeclare(queueName, false, false, false, null);
            //声明交换机(durable -> true,持久化，)
            channel.exchangeDeclare(exchange, extype,false);
            //队列绑定
            channel.queueBind(queueName, exchange, routingKey);
            channel.basicPublish(exchange, routingKey, MessageProperties.BASIC, message.getBytes(UTF_8) );
            return channel.waitForConfirms();
        } catch (Exception e) {
            logger.error("error", e);
            return false;
        }finally {
            if (channel != null) {
                rabbitChannelPool.returnObject(channel);
            }
        }
    }

    @Override
    public void startConsumer(MqCallService callback, String queueName, String routingKey, String exchange, String extype, boolean durable) {
        Channel channel = null;
        try {
            channel = rabbitChannelPool.borrowObject();
            channel.queueDeclare(queueName, durable, false, false, null);
            channel.queueBind(queueName, exchange, routingKey);
            final Consumer consumer = new DefaultConsumer(channel){
                @Override
                public void handleDelivery(String consumerTag, Envelope envelope, AMQP.BasicProperties properties, byte[] body) throws IOException {
                    try {
                        String message = new String(body, UTF_8);
                        callback.call(message, null, 0);
                    } catch (Exception ex) {
                        logger.error("消费消息错误", ex);
                    }
                }
            };
            channel.basicConsume(queueName, true, consumer);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}

```

