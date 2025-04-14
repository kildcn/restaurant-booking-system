const moment = require('moment');
const Restaurant = require('../models/Restaurant');
const Table = require('../models/Table');
const Booking = require('../models/Booking');
const Availability = require('../models/Availability');

/**
 * Check if restaurant is open at the requested date and time
 * @param {Date} date - Booking date
 * @param {Date} startTime - Booking start time
 * @param {Date} endTime - Booking end time
 * @returns {Object} { isOpen, reason }
 */
exports.checkRestaurantOpen = async (date, startTime, endTime) => {
  const restaurant = await Restaurant.findOne();
  if (!restaurant) {
    return { isOpen: false, reason: 'Restaurant configuration not found' };
  }

  // Check if date is in closedDates
  const dateStr = moment(date).format('YYYY-MM-DD');
  const isClosed = restaurant.closedDates.some(closed =>
    moment(closed.date).format('YYYY-MM-DD') === dateStr
  );

  if (isClosed) {
    const closedDate = restaurant.closedDates.find(closed =>
      moment(closed.date).format('YYYY-MM-DD') === dateStr
    );
    return {
      isOpen: false,
      reason: `Restaurant is closed on this date${closedDate.reason ? ': ' + closedDate.reason : ''}`
    };
  }

  // Check for special events that might override regular hours
  const specialEvent = restaurant.specialEvents.find(event =>
    moment(event.date).format('YYYY-MM-DD') === dateStr
  );

  // Get day of week (0 = Sunday, 6 = Saturday)
  const dayOfWeek = moment(date).day();

  // Find opening hours for the day
  let dayHours;
  if (specialEvent && specialEvent.customOpeningHours) {
    dayHours = {
      open: specialEvent.customOpeningHours.open,
      close: specialEvent.customOpeningHours.close,
      isClosed: false
    };
  } else {
    dayHours = restaurant.openingHours.find(h => h.day === dayOfWeek);
  }

  // Check if day is a regular closing day
  if (!dayHours || dayHours.isClosed) {
    return {
      isOpen: false,
      reason: 'Restaurant is closed on this day'
    };
  }

  // Check if booking time is within opening hours
  const openTime = moment(date).format('YYYY-MM-DD') + ' ' + dayHours.open;
  const closeTime = moment(date).format('YYYY-MM-DD') + ' ' + dayHours.close;

  // Handle case where closing time is after midnight
  let closeDateTime = moment(closeTime);
  if (dayHours.close < dayHours.open) {
    closeDateTime = closeDateTime.add(1, 'day');
  }

  const bookingStartTime = moment(startTime);
  const bookingEndTime = moment(endTime);

  if (bookingStartTime.isBefore(moment(openTime)) ||
      bookingEndTime.isAfter(closeDateTime)) {
    return {
      isOpen: false,
      reason: `Booking is outside opening hours (${dayHours.open} - ${dayHours.close})`
    };
  }

  return { isOpen: true };
};

/**
 * Find available tables for a booking
 * @param {Date} date - Booking date
 * @param {Date} startTime - Booking start time
 * @param {Date} endTime - Booking end time
 * @param {Number} partySize - Number of people
 * @param {Boolean} isStaff - Whether the booking is made by staff (bypasses some restrictions)
 * @returns {Object} { available, tables, reason }
 */
exports.findAvailableTables = async (date, startTime, endTime, partySize, isStaff = false) => {
  // Get all active tables
  const tables = await Table.find({ isActive: true });
  if (!tables.length) {
    return { available: false, reason: 'No tables configured in the system' };
  }

  // Get restaurant settings
  const restaurant = await Restaurant.findOne();

  // Check party size limitations for customers (not for staff)
  if (!isStaff && partySize > restaurant.bookingRules.maxPartySize) {
    return {
      available: false,
      reason: `Online booking is limited to parties of ${restaurant.bookingRules.maxPartySize} or fewer. Please contact the restaurant directly.`
    };
  }

  // Get all bookings that overlap with the requested time
  const overlappingBookings = await Booking.find({
    date: { $eq: moment(date).startOf('day').toDate() },
    status: { $in: ['pending', 'confirmed', 'seated'] },
    $or: [
      {
        'timeSlot.start': { $lt: endTime },
        'timeSlot.end': { $gt: startTime }
      }
    ]
  }).select('tables partySize timeSlot.start timeSlot.end');

  // Get all table IDs that are already booked during this time
  const bookedTableIds = new Set();
  overlappingBookings.forEach(booking => {
    booking.tables.forEach(tableId => {
      bookedTableIds.add(tableId.toString());
    });
  });

  // Filter available tables based on capacity and availability
  const availableTables = tables
    .filter(table => !bookedTableIds.has(table._id.toString()) && table.isReservable)
    .sort((a, b) => a.capacity - b.capacity); // Sort by capacity (ascending)

  if (!availableTables.length) {
    return { available: false, reason: 'No tables available for the requested time' };
  }

  // Find best table or combination of tables for the party size
  const result = this.findBestTableCombination(availableTables, partySize);

  if (!result.tables.length) {
    return {
      available: false,
      reason: 'No suitable table configuration available for the party size'
    };
  }

  // Calculate total capacity of selected tables
  const totalCapacity = result.tables.reduce((sum, table) => sum + table.capacity, 0);

  // Check if we've exceeded the restaurant's max capacity with this booking
  const currentBookedPeople = overlappingBookings.reduce((sum, booking) => {
    // Only count bookings that overlap with the requested time slot
    const bookingStart = moment(booking.timeSlot.start);
    const bookingEnd = moment(booking.timeSlot.end);
    const requestStart = moment(startTime);
    const requestEnd = moment(endTime);

    if (
      (bookingStart.isBefore(requestEnd) || bookingStart.isSame(requestEnd)) &&
      (bookingEnd.isAfter(requestStart) || bookingEnd.isSame(requestStart))
    ) {
      return sum + booking.partySize;
    }
    return sum;
  }, 0);

  const totalPeopleIfBooked = currentBookedPeople + partySize;
  const maxAllowed = Math.floor(restaurant.maxCapacity * (restaurant.bookingRules.maxCapacityThreshold / 100));

  if (!isStaff && totalPeopleIfBooked > maxAllowed) {
    return {
      available: false,
      reason: 'This booking would exceed the restaurant capacity for this time slot'
    };
  }

  // Return available tables
  return {
    available: true,
    tables: result.tables,
    capacity: totalCapacity
  };
};

/**
 * Find the best combination of tables for a party size
 * @param {Array} availableTables - Array of available tables
 * @param {Number} partySize - Number of people
 * @returns {Object} { tables }
 */
exports.findBestTableCombination = (availableTables, partySize) => {
  // First, try to find a single table that fits the party perfectly
  const perfectTable = availableTables.find(table => table.capacity === partySize);
  if (perfectTable) {
    return { tables: [perfectTable] };
  }

  // Then try to find a single table that can accommodate the party with minimal waste
  const suitableTables = availableTables.filter(table => table.capacity >= partySize);
  if (suitableTables.length > 0) {
    // Sort by capacity (ascending) to find the smallest suitable table
    suitableTables.sort((a, b) => a.capacity - b.capacity);
    return { tables: [suitableTables[0]] };
  }

  // If no single table is large enough, try combinations of tables
  // This is a simplified approach - in a real-world scenario, you might
  // want to implement a more sophisticated algorithm (e.g., knapsack problem)
  let bestCombination = [];
  let bestCapacity = 0;

  // Try all combinations of 2 tables
  for (let i = 0; i < availableTables.length; i++) {
    for (let j = i + 1; j < availableTables.length; j++) {
      const capacity = availableTables[i].capacity + availableTables[j].capacity;
      if (capacity >= partySize && (bestCapacity === 0 || capacity < bestCapacity)) {
        bestCombination = [availableTables[i], availableTables[j]];
        bestCapacity = capacity;
      }
    }
  }

  // If needed and possible, try combinations of 3 tables
  if (bestCombination.length === 0) {
    for (let i = 0; i < availableTables.length; i++) {
      for (let j = i + 1; j < availableTables.length; j++) {
        for (let k = j + 1; k < availableTables.length; k++) {
          const capacity = availableTables[i].capacity + availableTables[j].capacity + availableTables[k].capacity;
          if (capacity >= partySize && (bestCapacity === 0 || capacity < bestCapacity)) {
            bestCombination = [availableTables[i], availableTables[j], availableTables[k]];
            bestCapacity = capacity;
          }
        }
      }
    }
  }

  return { tables: bestCombination };
};

/**
 * Update availability cache for a specific date
 * @param {Date} date - Date to update availability for
 */
exports.updateAvailabilityCache = async (date) => {
  const formattedDate = moment(date).startOf('day').toDate();
  const restaurant = await Restaurant.findOne();
  const tables = await Table.find({ isActive: true });

  // Get restaurant opening hours for this date
  const dayOfWeek = moment(date).day();
  const daySettings = restaurant.openingHours.find(h => h.day === dayOfWeek);

  // Check if restaurant is closed on this date
  const dateStr = moment(date).format('YYYY-MM-DD');
  const isClosed = restaurant.closedDates.some(closed =>
    moment(closed.date).format('YYYY-MM-DD') === dateStr
  );

  // Check for special events
  const specialEvent = restaurant.specialEvents.find(event =>
    moment(event.date).format('YYYY-MM-DD') === dateStr
  );

  // If restaurant is closed or it's a regular closing day, mark all tables as unavailable
  if (isClosed || (daySettings && daySettings.isClosed)) {
    for (const table of tables) {
      await Availability.findOneAndUpdate(
        { date: formattedDate, tableId: table._id },
        {
          date: formattedDate,
          tableId: table._id,
          availableSlots: [],
          blockedSlots: [{
            start: moment(date).startOf('day').toDate(),
            end: moment(date).endOf('day').toDate(),
            reason: 'closed'
          }]
        },
        { upsert: true, new: true }
      );
    }
    return;
  }

  // Determine opening hours for the day
  let openTime, closeTime;
  if (specialEvent && specialEvent.customOpeningHours) {
    openTime = specialEvent.customOpeningHours.open;
    closeTime = specialEvent.customOpeningHours.close;
  } else if (daySettings) {
    openTime = daySettings.open;
    closeTime = daySettings.close;
  } else {
    // Default hours if none specified
    openTime = '09:00';
    closeTime = '22:00';
  }

  // Generate time slots based on restaurant's time slot duration
  const slotDuration = restaurant.bookingRules.timeSlotDuration;
  const startDateTime = moment(date).set({
    hour: parseInt(openTime.split(':')[0]),
    minute: parseInt(openTime.split(':')[1]),
    second: 0
  });

  let endDateTime = moment(date).set({
    hour: parseInt(closeTime.split(':')[0]),
    minute: parseInt(closeTime.split(':')[1]),
    second: 0
  });

  // Handle closing time after midnight
  if (closeTime < openTime) {
    endDateTime = endDateTime.add(1, 'day');
  }

  // Get all bookings for this date
  const bookings = await Booking.find({
    date: formattedDate,
    status: { $in: ['pending', 'confirmed', 'seated'] }
  }).select('tables timeSlot.start timeSlot.end');

  // Update availability for each table
  for (const table of tables) {
    // Generate available slots
    const availableSlots = [];
    let currentSlot = startDateTime.clone();

    while (currentSlot.isBefore(endDateTime)) {
      const slotStart = currentSlot.clone();
      const slotEnd = currentSlot.clone().add(slotDuration, 'minutes');

      // Don't add partial slots that extend beyond closing time
      if (slotEnd.isAfter(endDateTime)) {
        break;
      }

      availableSlots.push({
        start: slotStart.toDate(),
        end: slotEnd.toDate()
      });

      currentSlot.add(slotDuration, 'minutes');
    }

    // Find bookings for this table
    const tableBookings = bookings.filter(booking =>
      booking.tables.some(t => t.toString() === table._id.toString())
    );

    // Create blocked slots for each booking
    const blockedSlots = tableBookings.map(booking => ({
      start: booking.timeSlot.start,
      end: booking.timeSlot.end,
      reason: 'booking',
      bookingId: booking._id
    }));

    // Update or create availability document
    await Availability.findOneAndUpdate(
      { date: formattedDate, tableId: table._id },
      {
        date: formattedDate,
        tableId: table._id,
        availableSlots,
        blockedSlots
      },
      { upsert: true, new: true }
    );
  }
};
