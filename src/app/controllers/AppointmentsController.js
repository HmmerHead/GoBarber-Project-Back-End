// eslint-disable-next-line import/no-unresolved
import * as Yup from 'yup';
import { startOfHour, parseISO, isBefore, format, subHours } from 'date-fns';
import pt from 'date-fns/locale/pt';
import User from '../models/Users';
import Appointments from '../models/Appointments';
import File from '../models/File';
import Notification from '../schemas/Notification';
import Queue from '../../lib/Queue';
import CancellationMail from '../jobs/cancellationMail';

class AppointmentsController {
  async index(request, response) {
    const { page = 1 } = request.query;

    const appointments = await Appointments.findAll({
      where: { user_id: request.userId, canceled_at: null },
      order: ['date'],
      attributes: ['id', 'date', 'past', 'cancelable'],
      limit: 20,
      offset: (page - 1) * 20,
      include: [
        {
          model: User,
          as: 'provider', // Nome da relação no model
          attributes: ['id', 'name'],
          include: [
            {
              model: File,
              as: 'avatar',
              attributes: ['id', 'path', 'url'],
            },
          ],
        },
      ],
    });

    if (Object.is(appointments, null)) {
      return response.status(401).json({
        error: 'Marcacoes nao encontradas',
      });
    }

    return response.json(appointments);
  }

  async store(request, response) {
    // Precisa de uma validação para o caso do usuario kmarcar um
    // hora pra ele mesmo
    const schema = Yup.object().shape({
      provider_id: Yup.number().required(),
      date: Yup.date().required(),
    });

    if (!(await schema.isValid(request.body))) {
      return response.status(400).json({
        error: 'validation fails',
      });
    }

    const { provider_id, date } = request.body;

    const isProvider = await User.findOne({
      where: { id: provider_id, provider: true },
    });

    if (!isProvider) {
      return response.status(401).json({
        error: 'Vc so pode marcar horario com um provedor',
      });
    }

    const hourStart = startOfHour(parseISO(date));

    if (isBefore(hourStart, new Date())) {
      return response.status(400).json({
        error: 'Depois da Hora atual',
      });
    }

    const disponibilidade = await Appointments.findOne({
      where: { provider_id, canceled_at: null, date: hourStart },
    });

    if (disponibilidade) {
      return response.status(400).json({
        error: 'A data não está disponivel',
      });
    }

    const appointments = await Appointments.create({
      user_id: request.userId,
      provider_id,
      date,
    });

    const user = await User.findByPk(request.userId);
    const DataFormatada = format(
      hourStart,
      "'dia' dd 'de' MMMM', às' H:mm'h'",
      { locale: pt }
    );

    await Notification.create({
      content: `Novo agendamento de ${user.name} para o ${DataFormatada}`,
      user: provider_id,
    });

    return response.json(appointments);
  }

  async delete(request, response) {
    const appointments = await Appointments.findByPk(request.params.id, {
      include: [
        {
          model: User,
          as: 'provider',
          attributes: ['name', 'email'],
        },
        {
          model: User,
          as: 'user',
          attributes: ['name'],
        },
      ],
    });

    if (Object.is(appointments, null)) {
      return response.status(401).json({
        error: 'Marcacao nao encontrada',
      });
    }

    if (appointments.user_id !== request.userId) {
      return response.status(401).json({
        error: 'Voce nao tem permissao de cancelar essa marcacao',
      });
    }

    const dateWithSub = subHours(appointments.date, 2);

    if (isBefore(dateWithSub, new Date())) {
      return response.status(401).json({
        error: 'So pode cancelar com 2 h de antecedencia',
      });
    }

    appointments.canceled_at = new Date();

    await appointments.save();

    Queue.add(CancellationMail.key, {
      appointments,
    });

    return response.json(appointments);
  }
}

export default new AppointmentsController();
