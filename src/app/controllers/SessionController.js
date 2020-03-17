import jwt from 'jsonwebtoken';

import authConfig from '../../config/auth';
import User from '../models/Users';

class SessionController {
  async store(request, response) {
    const { email, password } = request.body;

    const user = await User.findOne({ where: { email } });

    if (!user) {
      return response.status(401).json({ error: 'User não encontrado' });
    }

    if (!(await user.checkPassword(password))) {
      return response.status(401).json({ error: 'Password não bate' });
    }

    const { id, name } = user;

    return response.json({
      user: { id, name, email },
      token: jwt.sign({ id }, authConfig.secret, {
        expiresIn: authConfig.expiresIn,
      }),
    });
  }
}

export default new SessionController();
