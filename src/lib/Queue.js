import Bee from 'bee-queue';
import CancellationMail from '../app/jobs/cancellationMail';
import redisConfig from '../config/redis';

// Variavel para colocar as jobs criadas
const jobs = [CancellationMail];

class Queue {
  constructor() {
    this.queues = {};

    this.init();
  }

  init() {
    jobs.forEach(({ key, handle }) => {
      this.queues[key] = {
        bee: new Bee(key, { redis: redisConfig }),
        handle,
      };
    });
  }

  add(queue, job) {
    return this.queues[queue].bee.createJob(job).save();
  }

  // Processa a Fila e lanca um erro, caso ocorra.
  processQueue() {
    jobs.forEach(job => {
      const { bee, handle } = this.queues[job.key];

      bee.on('failed', this.handleFailure).process(handle);
    });
  }

  // Exibe o erro no console.
  handleFailure(job, error) {
    console.log(`Queue ${job.queue.name}: Failed`, error);
  }
}

export default new Queue();
