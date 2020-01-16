---
title: I/O流
tags:
  - 消息中间件
categories:
  - MQ
abbrlink: 34363
date: 2019-05-08 22:16:00
---

- 输入流：从
- 输出流：
- 字节流：一次读入或者是读取八位二进制，后缀为***`Stream`\***
- 字符流：一次读取或是读取十六位二进制，后缀为***`Reader、Writer`\***

#### 字节流详解

##### InputStream 输入

**方法**

- `available()` 返回stream中可读的字节数，需子类实现。
- `read()`  读取一个byte字节，返回的是int。
- `read(byte[])` 一次性读取所有的字节到字节数组缓冲区中，返回独到的字节数，没有可用的字节返回-1(阻塞方法，直到直到有可用的数据)。
- `read(byte[],int offset,int len)`  从数据流中的offset读取len长度的数据到缓冲字节数组中,没有可用的字节返回-1(阻塞方法，直到直到有可用的数据)
- `close()` 关闭流，在每次用完流之后必须关闭

###### ByteArrayInputStream 读取输入流中的数据保存到内存的字节数组中

1. 构造方法：

- `ByteArrayInputStream(byte[])` 创建一个新的字节数组输入流，从指定的字节数据中读取数据。
- `ByteArrayInputStream(byte[] buf,int off,int len)` 创建一个新的字节数组输入流，从指定的字节数组buf中从off位置读取len长度的数据

###### FileInputStream 讲一个文件作为InputStream

构造器

- `FileInputStream(File)` 创建一个文件流，从文件中读取数据

- `FileInputStream(FileDescriptor)` 创建一个文件流，从指定的文件描述中读取数据

- `FileInputStream(String)` 创建一个文件流，从指定的文件名称获取文件数据。

###### BufferedInputStream

> 继承FilterInputStream类

> 在创建BufferedInputStream的时候，会创建一个内部的缓冲数组，一次性的从底层输入流中读取多个字节来填充byte数组，当程序读取一个或多个字节时，可直接从byte数组中读取，当内存中的byte读取完毕后，会再次调用底层的输入流来获取数据填充缓冲区数组。

> 优点：减少IO次数，提高读取速度，以前获取一个字节就要进行一次IO操作，现在每次IO从磁盘读取一大块数据，当你从
>
> BufferedInputStream读取数据的时候，先从内存的缓冲区字节数组中读取，读取完了，在进行下一次的IO操作。

**构造函数**

- `BufferedInputStream(InputStream in)`创建默认的缓冲流，缓冲区大小8192kb
- `BufferedInputStream(InputStream in, int size)` 创建指定大小缓冲区字节数组的缓冲流

> 注: [BufferedInputStream详解使用](https://www.cnblogs.com/lcy0515/p/9179736.html)

###### DataInputStream

> DataInputStream可以让你从InputStream读取Java基本类型来代替原始的字节,通常和DataOutputStream配合使用

##### OutputStream

**常用方法**

- `write(int)` 写入一个字节到输出流中
- `write(byte[])` 写入一个byte[] 数组到输出流中
- `write(byte[],int off,int len)` 把byte[]数组从off开始写入len长度的数据
- `close()` 关闭流
- `flush()` 刷新流，让缓冲区中的数据强制输出

###### ByteArrayOutputStream

> 把数据存入内存中的一个缓冲区，该类实现一个以字节数组形式写入数据的输出流。

**构造器**
`ByteArrayOutputStream()` 创建一个新的字节数组输出流

`ByteArrayOutputStream(int)` 创建一个新的字节数组输出流，并制定大小的缓冲区

**方法示例**

`toByteArray()` 把字节流转为字节数组

`toString()` 把字节流转为一个String 对象

###### FileOutputStream

> 想指定的文件对象或者文件描述符输出数据的输出流

**构造器**

- `FileOutputStream(File name)`
- `FileOutputStream(String name)`

- `FileOutputStream(String, boolean)`

---

#### 字符流

以`Unicode`字符为导向的流，表示以`Unicode`字符为单位向`Stream`中存储或者是从`Stream`中读取。`Reader/Writer`为抽象类，其中方法和`InputStream和OutputStraem`中对应。

##### Reader

在UTF(UTF-8 或 UTF-16)格式存储数据的时候，UTF-8中一个或多个字节表示一个字符，UTF-16使用两个字节来标识一个字符，

在使用`InputStream`来按字节读取数据的时候，把字节转成字符，不一定能获取到自己想要的数据，这个时候便可以使用字符流，

`Reader`可以把字节转换为字符。

**主要方法**

- `read()` 读取一个字符，会返回一个int类型，表示下一个要读取的字符，如果返回-1表示已经没有数据了。
- `close()` 关闭流

###### 主要的Reader流

- `CharArrayReader` 用于字符输入流的缓冲区

- `StringReader` 构建一个字符串输入流

- `FileReader` 文件字符输入流与FileInputStream 对应

- `PipedReader `

- `InputStreamReader` 将字节流InputStream转为字符流

  构造方法

  `InputStreamReader(InputStream in)`  构建默认编码的字符流

  `InputStreamReader(InputStream in, String charsetName)`  构建指定编码集的字符流

##### Writer

主要的Writer流，同上面Reader对饮

- `CharArrayWriter`

- `StringWriter`

- `FileWriter`

- `PipedWriter`

- `OutputStreamWriter`

- `PrintReader`

  > PrintWriter 是字符类型的打印输出流，它用于像文本输出流中写入数据

  **构造方法**

  `PrintWriter(File file) `      使用指定文件创建不具有自动行刷新的新 PrintWriter。   
  `PrintWriter(File file, String csn) `      创建具有指定文件和字符集且不带自动刷行新的新 PrintWriter。   
  `PrintWriter(OutputStream out)`     根据现有的 OutputStream 创建不带自动行刷新的新 PrintWriter。   
  `PrintWriter(OutputStream out, boolean autoFlush) `    通过现有的 OutputStream 创建新的 PrintWriter。   
  `PrintWriter(String fileName) `   创建具有指定文件名称且不带自动行刷新的新 PrintWriter。   
  `PrintWriter(String fileName, String csn) `   创建具有指定文件名称和字符集且不带自动行刷新的新 PrintWriter。   
  `PrintWriter(Writer out) `    创建不带自动行刷新的新 PrintWriter。   
  `PrintWriter(Writer out, boolean autoFlush) `     创建新 PrintWriter。  

IO 使用的准则

- 按流水的来源和去向

  文件FileInputStream, FileOutputStream, ( 字节流 )FileReader, FileWriter( 字符 )

  是 byte[] ： ByteArrayInputStream, ByteArrayOutputStream( 字节流 )

  是 Char[]: CharArrayReader, CharArrayWriter( 字符流 )

  是 String: StringBufferInputStream, StringBufferOuputStream ( 字节流 )StringReader,

  网络数据流： InputStream, OutputStream,( 字节流 ) Reader, Writer( 字符流 )

- 按数据格式分

  二进制格式（只要不能确定是纯文本的） : InputStream, OutputStream 及其所有带 Stream 结束的子类

  纯文本格式（含纯英文与汉字或其他编码方式）； Reader, Writer 及其所有带 Reader, Writer 的子类

- 按是否要缓冲分

  要缓冲： BufferedInputStream, BufferedOutputStream,( 字节流 ) BufferedReader, BufferedWriter( 字符流 )
