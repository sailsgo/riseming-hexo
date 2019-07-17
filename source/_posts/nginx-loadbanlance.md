---
title: 负载均衡和反向代理
tags:
  - 负载均衡
  - 反向代理
categories:
  - 负载均衡
abbrlink: 34786
date: 2019-05-01 01:00:00
---
# 负载均衡和反向代理
## upstream 配置
- ip地址和端口
- 权重：默认是1，配置越高权重越高  

## 负载均衡算法
- round-robin 基于权重的仑村
- ip_hash 根据客户ip进行负载均衡
- hash_key 对某一个key进行hash
- 哈希算法，根据请求的uri进行负载均衡

## 失败重试
配置max_fails和fail_timeout 当指定时间内失败指定的次数将摘掉上游服务器，然后fail_timeout之后，会把服务器加入存活的列表中

## 健康检查
- TCP心跳检查：upstream 下配置check interval = rise=  fail=  timeout=    type = tcp;进行tcp 心跳检查
- HTTP心跳检查：对于TCP需要额外的两项配置，check_http_send ,check_http_expect_alive
- - - -
## HTTP动态负载均衡
### Consul 实现分布式服务的注册与发现
- 服务注册：通过http api 将服务注册到consul
- 服务发现：服务消费者通过http api 从consul 获取服务的ip和端口
- 故障检测
- K/V存储
- 多数据中心
- rasf算法

### Consul+ Consul-template
- Consul server
- Consul-template
> 每次发现配置变更都需要reload nginx，而reload 会有一定的损耗  

### Consul + OpenResty
- 使用Consul注册服务之后，使用OpenResty banlance_by_lua 实现无reload 动态负载均衡


