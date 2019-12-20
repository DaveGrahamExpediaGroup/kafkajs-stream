/* eslint-disable no-underscore-dangle */
import { CompressionTypes, Kafka, Message, Producer, ProducerConfig } from 'kafkajs';
import { Writable } from 'stream';

interface ProducerObjectStreamOptions {
  config?: ProducerConfig;
  topic: string;
  acks?: number;
  timeout?: number;
  compression?: CompressionTypes;
}

export class ProducerObjectStream extends Writable {
  constructor(kafka: Kafka, options: ProducerObjectStreamOptions) {
    super({ objectMode: true });
    this.producer = kafka.producer(options.config);
    this.options = options;
    this.connected = false;
  }

  private producer: Producer;

  private options: ProducerObjectStreamOptions;

  private connected: boolean;

  _writev(chunks: { chunk: Message; encoding: string }[], callback: (error?: Error | null) => void) {
    (async () => {
      try {
        if (!this.connected) {
          this.connected = true;
          await this.producer.connect();
        }
        await this.producer.send({
          topic: this.options.topic,
          messages: chunks.map(({ chunk }) => chunk),
          acks: this.options.acks,
          timeout: this.options.timeout,
          compression: this.options.compression,
        });
        callback(null);
      } catch (e) {
        callback(e);
      }
    })();
  }

  _destroy(error: Error | null) {
    this.producer.disconnect();
    super.destroy(error === null ? undefined : error);
  }
}
