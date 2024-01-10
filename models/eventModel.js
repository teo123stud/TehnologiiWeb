const { Sequelize, DataTypes } = require('sequelize');
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: 'database.sqlite'
});

const Event = sequelize.define('Event', {
  eventName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  eventStatus: {
    type: DataTypes.ENUM('CLOSED', 'OPEN'),
    defaultValue: 'CLOSED'
  },
  eventCode: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  eventDate: {
    type: DataTypes.DATE,
    allowNull: false
  }
});
const Participant = sequelize.define('Participant', {
    participantName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    attendanceTime: {
      type: DataTypes.DATE
    }
  });
Event.hasMany(Participant, { as: 'participants' });
Participant.belongsTo(Event);
module.exports = {Event, Participant};
