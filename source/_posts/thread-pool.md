title: 线程池
tags:
  - Executor
  - 线程池
categories:
  - 线程池
abbrlink: 227
date: 2019-06-20 20:13:00
---
## 为什么使用线程池
- 创建/销毁线程伴随着系统开销，过于频繁的创建/销毁线程，会很大程度上影响处-理效率
- 线程并发数量过多，抢占系统资源从而导致阻塞
- 对线程进行一些简单的管理
- - - -
## 线程池的创建
> 线程池的概念是Executor这个接口，具体实现为ThreadPoolExecutor类  

```Java
public ThreadPoolExecutor(int corePoolSize,
                          int maximumPoolSize,
                          long keepAliveTime,
                          TimeUnit unit,
                          BlockingQueue<Runnable> workQueue,
                          ThreadFactory threadFactory,
                          RejectedExecutionHandler handler)
```
- `int corePoolSize` : 该线程池中**核心线程数最大值**

> 核心线程：线程池新建线程的时候，如果当前线程总数小于corePoolSize，则新建的是核心线程，如果超过corePoolSize，则新建的是非核心线程核心线程默认情况下会一直存活在线程池中，即使这个核心线程啥也不干(闲置状态)。  
如果指定ThreadPoolExecutor的allowCoreThreadTimeOut这个属性为true，那么核心线程如果不干活(闲置状态)的话，超过一定时间(时长下面参数决定)，就会被销毁掉

* `int maximumPoolSize`：**该线程池中线程总数最大值**

> 线程总数 = 核心线程数 + 非核心线程数。  
* **long keepAliveTime**：该线程池中 **非核心线程闲置超时时长**

> 一个非核心线程，如果不干活(闲置状态)的时长超过这个参数所设定的时长，就会被销毁掉，如果设置`allowCoreThreadTimeOut = true`，则会作用于核心线程  
* **TimeUnit unit：**keepAliveTime的单位
- **BlockingQueue workQueue**：该线程池中的任务队列：维护着等待执行的Runnable对象
当所有的核心线程都在干活时，新添加的任务会被添加到这个队列中等待处理，如果队列满了，则新建非核心线程执行任务。
### 常用的workQueue类型：
- **SynchronousQueue**：这个队列接收到任务的时候，会直接提交给线程处理，而不保留它，如果所有线程都在工作怎么办？那就新建一个线程来处理这个任务！所以为了保证不出现<线程数达到了maximumPoolSize而不能新建线程>的错误，使用这个类型队列的时候，maximumPoolSize一般指定成Integer.MAX_VALUE，即无限大。
- **ArrayBlockingQueue**：可以限定队列的长度，接收到任务的时候，如果没有达到corePoolSize的值，则新建线程(核心线程)执行任务，如果达到了，则入队等候，如果队列已满，则新建线程(非核心线程)执行任务，又如果总线程数到了maximumPoolSize，并且队列也满了，则发生错误
- **DelayQueue**：队列内元素必须实现Delayed接口，这就意味着你传进去的任务必须先实现Delayed接口。这个队列接收到任务时，首先先入队，只有达到了指定的延时时间，才会执行任务
- **ThreadFactory threadFactory**：创建线程的方式，这是一个接口，你new他的时候需要实现他的Thread newThread(Runnable r)方法，一般用不上
- **RejectedExecutionHandler handler**：这玩意儿就是抛出异常专用的，比如上面提到的两个错误发生了，就会由这个handler抛出异常，根本用不上
---
## 线程池执行策略
- `当数量未达到corePoolSize，则新建一个**线程(核心线程)** 执行任务`
- `当线程数量达到corePoolSize，则将任务移入队列`
- `队列已满， **新建线程(非核心线程)**~ 执行任务`
- `队列已满，总线程数又达到了maximumPoolSize,就会由(RejectedExecutionHandler)抛出异常`
---
## 常见的线程池
> Java通过Executors提供了四种线程池,这四种线程池都是直接或间接配置ThreadPoolExecutor的参数实现的  
- `可缓存线程池CachedThreadPool()`

```Java
public static ExecutorService newCachedThreadPool() {
        return new ThreadPoolExecutor(0, Integer.MAX_VALUE,
                                      60L, TimeUnit.SECONDS,
                                      new SynchronousQueue<Runnable>());
    }

```
1. 没有核心线程，线程数量没有限制。
2. 创建任务的时候，如果有空闲的线程则复用空闲的线程，若没有则新建线程
3. 闲置状态的线程在超过60s还未做事，就会销毁
- `FixedThreadPool定长线程池`

```Java
public static ExecutorService newFixedThreadPool(int nThreads) {
    return new ThreadPoolExecutor(nThreads, nThreads,
                                  0L, TimeUnit.MILLISECONDS,
                                  new LinkedBlockingQueue<Runnable>());
}
```
1. 最大线程数等于核心线程数，默认该线程池的线程不会因为闲置状态超时而被销毁
2. 当前线程数小于核心线程数，且有空闲的线程时，提交任务会新建线程而不是使用限制的线程
- `SingleThreadPool`

```Java
public static ExecutorService newSingleThreadExecutor() {
    return new FinalizableDelegatedExecutorService
        (new ThreadPoolExecutor(1, 1,
                                0L, TimeUnit.MILLISECONDS,
                                new LinkedBlockingQueue<Runnable>()));
}

```

1. 有且仅有一个工作线程执行任务
2. 所有任务按照指定顺序执行，即遵循队列的入队出队规则
-  `ScheduledThreadPool`

```Java
public static ScheduledExecutorService newScheduledThreadPool(int corePoolSize) {
    return new ScheduledThreadPoolExecutor(corePoolSize);
}

//ScheduledThreadPoolExecutor():
public ScheduledThreadPoolExecutor(int corePoolSize) {
    super(corePoolSize, Integer.MAX_VALUE,
          DEFAULT_KEEPALIVE_MILLIS, MILLISECONDS,
          new DelayedWorkQueue());
}
```
1. 闲置时间DEFAULT_KEEPALIVE_MILLIS -> 10s，最大线程数位Integer.MAX_VALUE
2. 这个线程池是上述4个中为唯一个有延迟执行和周期执行任务的线程池

```Java

ExecutorService mScheduledThreadPool = Executors.newScheduledThreadPool(int corePoolSize);
```
- 延时任务

```Java
//3s之后执行我们的任务
mScheduledThreadPool.schedule(new Runnable() {
            @Override
            public void run() {
            //....
            }
        }, 3, TimeUnit.SECONDS);

```
- 循环任务

> 延迟3秒后执行任务，从开始执行任务这个时候开始计时，每7秒执行一次不管执行任务需要多长的时间

```Java
mScheduledThreadPool.scheduleAtFixedRate(new Runnable() {
            @Override
            public void run() {
             //....
            }
        },3, 7, TimeUnit.SECONDS);

```
> 延迟3秒后执行任务,从任务完成时这个时候开始计时，7秒后再执行  
也就是说这里的循环执行任务的时间点是从上一个任务完成的时候

```java
mScheduledThreadPool.scheduleWithFixedDelay(new Runnable() {
            @Override
            public void run() {
             //....
            }
        },3, 7, TimeUnit.SECONDS);

```

> `注：scheduleAtFixedRate与scheduleWithFixedDelay区别在于：  
> scheduleAtFixedRate 定时的周期循环执行任务，不管执行任务需要耗时多久  
> scheduleWithFixedDelay 等待上一次任务执行完成后开始计时 `
---
## 线程池的关闭
- 立即关闭

```Java
shutDownNow()
```
- 任务执行完成后关闭：

```Java
shutdown()
```

- - - -
## 如何配置线程
- IO 密集型任务：由于线程并不是一直在运行，所以可以尽可能的多配置线程，比如 CPU 个数 * 2
- CPU 密集型任务（大量复杂的运算）：应当分配较少的线程，比如 CPU 个数相当的大小

> 当然这些都是经验值，最好的方式还是根据实际情况测试得出最佳配置。  
- - - -
## **如何监控线程池**
线程怎么说都是稀缺资源，对线程池的监控可以知道自己任务执行的状况、效率，ThreadPoolExecutor 中提供了很多对线程池的状态信息
- **getCorePoolSize()**  获取配置的核心线程数
- **getMaximumPoolSize()** 获取允许的最大线程数
- **getQueue().size()** 获取任务队列中的任务数量
- **getActiveCount()** 获取当前活动线程数
- **getPoolSize()** 获取总的线程数
- **getTaskCount()** 获取总的任务数
- **getCompletedTaskCount()** 已执行的任务数
