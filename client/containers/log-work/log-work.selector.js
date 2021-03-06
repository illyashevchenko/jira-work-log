import { curry, map, assoc, objOf, pipe } from 'ramda';
import { select } from '@rematch/select';
import { getHours } from '../../components/calendar/dates.service';

const getUserHours = (user, day) =>
  (day.spent || 0) +
  (user[day.date] ? getHours(user[day.date].timeSpentSeconds) : 0); // some dates may be missing

const getForAUser = (days, user) => {
  let total = 0;

  const filledDays = days.map(
    (day) => {
      const spent = user ? getUserHours(user, day) : 0;

      total += spent;
      return assoc('spent', spent, day); // still need to have spent property for each day
    },
  );

  return { total, days: filledDays };
};

const getGroupDailyWorklog = (days, users) => {
  const spends = users.reduce((result, { days }) => {
    days.forEach(({ date, spent }) => {
      result[date] = (result[date] || 0) + spent;
    });

    return result;
  }, {}); // { '2018-03-02': 10(h) }

  return days.map((day) => assoc('spent', spends[day.date] || 0, day));
};

const daysOff = [6, 0];

const adjustDayOff = ({ date }) => {
  const dateObj = new Date(date);
  const isDayOff = daysOff.includes(dateObj.getDay());

  return { date, isDayOff };
};

const getDailyFromList = map(pipe(objOf('date'), adjustDayOff));

const getByDays = (daysList, usersMap, userNames) => {
  let groupTotal = 0;
  const users = userNames.map((name) => {
    const { total, days } = getForAUser(daysList, usersMap[name]);

    groupTotal += total;

    return {
      name, days, total,
    };
  });

  return {
    users, total: groupTotal,
  };
};

const getForAGroup = curry((daysList, usersMap, { name, users: userNames, toAdd, isOpen }) => {
  const dailyList = getDailyFromList(daysList);
  const { users, total } = getByDays(dailyList, usersMap, userNames);
  const days = getGroupDailyWorklog(dailyList, users);

  return {
    isOpen, toAdd, name,
    total, users, days,
  };
});

export const get = (state) => {
  const groups = select.groups.all(state);
  const days = select.calendar.days(state);
  const users = select.users.worklog(state);

  return map(getForAGroup(days, users), groups);
};
