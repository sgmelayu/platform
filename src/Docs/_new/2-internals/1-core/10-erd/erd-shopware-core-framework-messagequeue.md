[titleEn]: <>(Asynchronous messaging)

The message queue provides the necessary glue code between the API and the internally used message bus.

![Asynchronous messaging](dist/erm-shopware-core-framework-messagequeue.svg)


### Table `dead_message`

Failing messages in the queue. Requeued with an ever increasing threshold.


### Table `message_queue_stats`

The number of tasks currently in the queue.

