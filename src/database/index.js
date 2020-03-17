import Sequelize from 'sequelize';
import Mongoose from 'mongoose';

import User from '../app/models/Users';
import File from '../app/models/File';
import Appointments from '../app/models/Appointments';
import databaseConfig from '../config/database';

// Onde os models vao ficar
const models = [User, File, Appointments];

class Database {
  constructor() {
    this.init();
    this.mongo();
  }

  init() {
    // variavel que está sendo esperada
    // na classe model em geral
    this.connection = new Sequelize(databaseConfig);
    models
      .map(model => model.init(this.connection))
      .map(model => model.associate && model.associate(this.connection.models));
  }

  mongo() {
    this.mongoConnection = Mongoose.connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useFindAndModify: true,
      useUnifiedTopology: true,
    });
  }
}

export default new Database();
