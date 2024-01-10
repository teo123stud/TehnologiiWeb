const { Event, Participant } = require('../models/eventModel');

const isEventOpen = (eventDate, scheduledDate) => {
  const currentDate = new Date();
  const eventDateTime = new Date(eventDate);
  const scheduledDateTime = new Date(scheduledDate);

  console.log('Current Date:', currentDate);
  console.log('Event Date Time:', eventDateTime);
  console.log('Scheduled Date Time:', scheduledDateTime);

  // Compară anul, luna, ziua, ora și minutul
  const isYearEqual = currentDate.getFullYear() === eventDateTime.getFullYear();
  const isMonthEqual = currentDate.getMonth() === eventDateTime.getMonth();
  const isDateEqual = currentDate.getDate() === eventDateTime.getDate();
  const isHourEqual = currentDate.getHours() === eventDateTime.getHours();
  const isMinutesGreaterOrEqual = currentDate.getMinutes() >= scheduledDateTime.getMinutes();
  const isCurrentGreaterOrEqual = currentDate >= scheduledDateTime;

  console.log('isYearEqual:', isYearEqual);
  console.log('isMonthEqual:', isMonthEqual);
  console.log('isDateEqual:', isDateEqual);
  console.log('isHourEqual:', isHourEqual);
  console.log('isMinutesGreaterOrEqual:', isMinutesGreaterOrEqual);
  console.log('isCurrentGreaterOrEqual:', isCurrentGreaterOrEqual);

  // Restul codului rămâne neschimbat

  return (
    isYearEqual &&
    isMonthEqual &&
    isDateEqual &&
    isHourEqual &&
    isMinutesGreaterOrEqual &&
    isCurrentGreaterOrEqual
  );
};


const schedule = require('node-schedule');

const scheduleEventStatusUpdate = async (eventId, scheduledDate) => {
  // Programați actualizarea stării evenimentului să ruleze la fiecare 2 minute
  const job = schedule.scheduleJob('*/2 * * * *', async () => {
    try {
      const event = await Event.findByPk(eventId);

      if (event) {
        console.log('Before update. Event Status:', event.eventStatus);

        // Verificați dacă evenimentul încă nu a început
        if (isEventOpen(event.eventDate, scheduledDate)) {
          event.update({
            eventStatus: 'OPEN',
          });
        } else {
          event.update({
            eventStatus: 'CLOSED',
          });
        }

        console.log('After update. Event Status:', event.eventStatus);
      }

      // Anulați programarea după prima rulare pentru a evita repetarea
      job.cancel();
    } catch (error) {
      console.error('Error updating event status:', error);
    }
  });
};
const eventController = {
  getAllEvents: async (req, res) => {
    try {
      const events = await Event.findAll({
        include: 'participants',
      });
      res.json(events);
    } catch (error) {
      console.error('Error fetching events:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  },

  createEvent: async (req, res) => {
    const { eventName, eventCode, eventDate, scheduledDate, participants } = req.body;

    try {
      // Verifică dacă eventDate și scheduledDate sunt valide
      if (!eventDate || isNaN(new Date(eventDate).getTime()) || !scheduledDate || isNaN(new Date(scheduledDate).getTime())) {
        return res.status(400).json({ error: 'Invalid eventDate or scheduledDate format' });
      }

     
const newEvent = await Event.create({
  eventName,
  eventCode,
  eventDate: new Date(eventDate),
  eventStatus: 'CLOSED', // Setează implicit la CLOSED la crearea evenimentului
});

// Restul codului rămâne neschimbat


      // Adăugare participanți la eveniment
      if (participants && participants.length > 0) {
        await Promise.all(
          participants.map(async (participantName) => {
            await Participant.create({
              participantName,
              EventId: newEvent.id,
            });
          })
        );
      }

      // Încărcare eveniment cu participanții asociați
      const eventWithParticipants = await Event.findByPk(newEvent.id, {
        include: 'participants',
      });

      res.json(eventWithParticipants);

      // Planifică actualizarea la 'OPEN' după 2 minute
      setTimeout(async () => {
        try {
          const updatedEvent = await Event.findByPk(newEvent.id);
          if (updatedEvent) {
            console.log('Before update to OPEN. Event Status:', updatedEvent.eventStatus);
  
            // Verifică dacă evenimentul încă nu a început
            if (isEventOpen(updatedEvent.eventDate, scheduledDate)) {
              updatedEvent.update({
                eventStatus: 'OPEN',
              });
  
              console.log('After update to OPEN. Event Status:', updatedEvent.eventStatus);
  
              // Planifică revenirea la 'CLOSED' după alte 2 minute
              setTimeout(async () => {
                try {
                  const closedEvent = await Event.findByPk(newEvent.id);
                  if (closedEvent) {
                    console.log('Before update to CLOSED. Event Status:', closedEvent.eventStatus);
  
                    closedEvent.update({
                      eventStatus: 'CLOSED',
                    });
  
                    console.log('After update to CLOSED. Event Status:', closedEvent.eventStatus);
                  }
                } catch (error) {
                  console.error('Error updating event status to CLOSED:', error);
                }
              }, 2 * 60 * 1000); // Setează timeout-ul pentru revenirea la 'CLOSED'
            }
          }
        } catch (error) {
          console.error('Error updating event status to OPEN:', error);
        }
      }, 2 * 60 * 1000); // Setează timeout-ul pentru actualizarea la 'OPEN'
    } catch (error) {
      console.error('Error creating event:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  },

  getEventById: async (req, res) => {
    const eventId = req.params.eventId;

    try {
      const event = await Event.findByPk(eventId, {
        include: 'participants',
      });

      if (!event) {
        return res.status(404).send('Event not found');
      }

      res.json(event);
    } catch (error) {
      console.error('Error fetching event by ID:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  },

  updateEvent: async (req, res) => {
    const eventId = req.params.eventId;
    const { eventName, eventCode, eventDate } = req.body;

    try {
      const event = await Event.findByPk(eventId);

      if (!event) {
        return res.status(404).send('Event not found');
      }

      // Actualizează eventDate
      event.update({
        eventName,
        eventCode,
        eventDate,
      });

      // Planifică verificarea automată și actualizarea stării după 2 minute
      scheduleEventStatusUpdate(eventId, eventDate);

      res.json(event);
    } catch (error) {
      console.error('Error updating event:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  },

  deleteEvent: async (req, res) => {
    const eventId = req.params.eventId;

    try {
      const event = await Event.findByPk(eventId, {
        include: 'participants',
      });

      if (!event) {
        return res.status(404).send('Event not found');
      }

      // Șterge toți participanții evenimentului
      await Participant.destroy({
        where: { EventId: eventId },
      });

      // Șterge evenimentul după ce toți participanții au fost șterși
      await event.destroy();

      res.json({ message: 'Event deleted successfully' });
    } catch (error) {
      console.error('Error deleting event:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  },

  updateParticipants: async (req, res) => {
    const eventId = req.params.eventId;
    const { participants } = req.body;

    try {
      const event = await Event.findByPk(eventId);

      if (!event) {
        return res.status(404).send('Event not found');
      }

      // Adaugă participanții la eveniment
      if (participants && participants.length > 0) {
        await Promise.all(
          participants.map(async (participantName) => {
            await Participant.create({
              participantName,
              EventId: event.id,
            });
          })
        );
      }

      // Încarcă evenimentul cu participanții actualizați
      const eventWithParticipants = await Event.findByPk(event.id, {
        include: 'participants',
      });

      res.json(eventWithParticipants);
    } catch (error) {
      console.error('Error updating participants:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  },
};

module.exports = eventController;
