<template>
  <div class="subcontent">
    <navigation-bar
      @today="onToday"
      @prev="onPrev"
      @next="onNext"
    />

    <div style="display: flex; justify-content: center; align-items: center;">
      <q-checkbox
        v-model="mobile"
        label="Mobile selection (first click, second click)"
      />
      <q-checkbox
        v-model="hover"
        label="Hover mode"
      />
    </div>

    <div style="display: flex; justify-content: center; align-items: center; flex-wrap: nowrap;">
      <div style="display: flex; max-width: 280px; width: 100%;">
        <q-calendar-month
          ref="calendar"
          v-model="selectedDate"
          :selected-dates="selectedDates"
          :selected-start-end-dates="startEndDates"
          mini-mode
          no-active-date
          enable-outside-days
          :hover="hover"
          animated
          bordered
          @mousedown-day="onMouseDownDay"
          @mouseup-day="onMouseUpDay"
          @mousemove-day="onMouseMoveDay"
          @change="onChange"
          @moved="onMoved"
          @click-day="onClickDay"
          @click-date="onClickDate"
          @click-workweek="onClickWorkweek"
          @click-head-workweek="onClickHeadWorkweek"
          @click-head-day="onClickHeadDay"
        />
      </div>
    </div>
    <pre>{{ JSON.stringify({
      dateRanges,
      selectedDates,
      startEndDates,
    }, null, 2) }}</pre>
  </div>
</template>

<script>
import {
  QCalendarMonth,
  today
} from '@quasar/quasar-ui-qcalendar/src/index.js'
import '@quasar/quasar-ui-qcalendar/src/QCalendarVariables.sass'
import '@quasar/quasar-ui-qcalendar/src/QCalendarTransitions.sass'
import '@quasar/quasar-ui-qcalendar/src/QCalendarMonth.sass'
import { parseTimestamp } from '@quasar/quasar-ui-qcalendar/src/utils/Timestamp.js'

import {
  defineComponent,
  ref,
  toRaw,
  computed,
  reactive,
} from 'vue'
import NavigationBar from '../components/NavigationBar.vue'
import {
  date,
} from 'quasar'

function leftClick (e) {
  return e.button === 0
}

function listDaysBetween(start, end) {
  if (start === end) {
    return [start]
  }

  if (start > end) {
    throw new Error('start must be before end')
  }
  const out = []
  let dayBetween = new Date(start)
  end = new Date(end)
  let endReached = false
  while (! endReached) {
    out.push(date.formatDate(dayBetween, 'YYYY-MM-DD'))
    endReached = date.isSameDate(end, dayBetween)
    dayBetween = date.addToDate(dayBetween, { days: 1 })
  }
  return out
}

class DateRangeList {
  #list = reactive([])
  #overlapEnabled = false
  constructor ({ overlapEnabled = false } = {}) {
    this.#overlapEnabled = overlapEnabled
  }

  add (range) {
    const rawThis = toRaw(this)
    range.list = rawThis // this?
    if (rawThis.#list.includes(range)) {
      console.warn('range already in list', range.toJSON())
      return
    }
    rawThis.#list.push(range)
  }

  deleteRange (range) {
    const rawThis = toRaw(this)
    const index = rawThis.#list.indexOf(range)
    if (index > -1) {
      console.log('deleteRange', JSON.stringify(range, null, 2))
      rawThis.#list.splice(index, 1)
    }
  }

  otherRanges (range) {
    const rawThis = toRaw(this)
    return rawThis.#list.filter(r => {
      // TODO compare by start and end?
      return r !== range
    })
  }

  get overlapEnabled () {
    const rawThis = toRaw(this)
    return rawThis.#overlapEnabled
  }

  set overlapEnabled (value) {
    const rawThis = toRaw(this)
    rawThis.#overlapEnabled = value
  }

  listOverlapingPreviousRanges(range, newStart=null) {
    const rawThis = toRaw(this)
    // ranges before: range having start < start
    const startToCheck = newStart ?? range.start
    const overlapingPreviousRanges = rawThis.#list.filter(listedRange => {
      // toRaw(listedRange) !== toRaw(range) && console.log('overlapingPreviousRange', {
      //   // listedRange: toRaw(listedRange),
      //   start: listedRange.start,
      //   end: listedRange.end,
      //   startsBeforeEnd: listedRange.start <= range.end,
      //   endsAfterStart: listedRange.end >= startToCheck,
      //   // range: toRaw(range),
      // })

      return toRaw(listedRange) !== toRaw(range)
        && listedRange.start <= range.end
        && listedRange.end   >= startToCheck
    })
    // overlapingPreviousRanges.length && console.log('overlapingPreviousRanges', overlapingPreviousRanges)
    return overlapingPreviousRanges
  }

  listOverlapingNextRanges(range, newEnd=null) {
    const rawThis = toRaw(this)
    // ranges before: range having start < start
    const endToCheck = newEnd ?? range.end
    const overlapingNextRanges = rawThis.#list.filter(listedRange => {
      // toRaw(listedRange) !== toRaw(range) && console.log('overlapingPreviousRange', {
      //   // listedRange: toRaw(listedRange),
      //   start: listedRange.start,
      //   end: listedRange.end,
      //   startsBeforeEnd: listedRange.start <= range.end,
      //   endsAfterStart: listedRange.end >= startToCheck,
      //   // range: toRaw(range),
      // })

      return toRaw(listedRange) !== toRaw(range)
        && listedRange.end   >= range.start
        && listedRange.start <= endToCheck
    })
    overlapingNextRanges.length && console.log('overlapingNextRanges', overlapingNextRanges)
    return overlapingNextRanges
  }

  listRangesHavingDayBetween (day) {
    const rawThis = toRaw(this)
    return rawThis.#list.filter(range => {
      return range.start !== day
        && range.end     !== day
        && range.hasDay(day)
    })
  }

  listRangesStartingOn (day) {
    const rawThis = toRaw(this)
    return rawThis.#list.filter(range => range.start === day)
  }

  listRangesEndingOn (day) {
    const rawThis = toRaw(this)
    return rawThis.#list.filter(range => range.end === day)
  }

  toggleDay (day) {
    const rawThis = toRaw(this)
    rawThis.#list.forEach(range => {
      range.hasDay(day) && range.toggleDay(day)
    })
  }

  toJSON () {
    const rawThis = toRaw(this)
    return rawThis.#list
  }

  toSelectedStartEndDatesProp () {
    const rawThis = toRaw(this)
    return rawThis.#list.map(range => {
      // console.log('toSelectedStartEndDatesProp() range', range.toJSON())
      return [
        range.start,
        range.end
      ]
    })
  }

  toSelectedDatesProp () {
    const rawThis = toRaw(this)
    const out = new Set()
    for (const range of rawThis.#list) {
      const rangeEnabledDays = Object.entries(range.days).filter(([, day]) => day.enabled).map(([day]) => day)
      // console.log('rangeEnabledDays', rangeEnabledDays)
      for (const day of rangeEnabledDays) {
        out.add(day)
      }
    }
    return Array.from(out)
  }
}

class DateRange {
  #start = ref(undefined)
  #end = ref(undefined)
  #days = reactive({})
  #list = null
  constructor (start, end) {
    this.#start.value = start
    this.#end.value = end
  }

  #enableNewDaysBetween () {
    // console.log('enableNewDaysBetween', { this: this })
    const days = listDaysBetween(this.#start.value, this.#end.value)
    // console.log('enableNewDaysBetween', { days })
    for (const day of days) {
      if (! (day in this.#days)) {
        // console.log('add day', day)
        this.#days[ day ] = {
          // value: day,
          enabled: true
        }
      }
    }
  }

  set start (newStart) {
    const rawThis = toRaw(this)
    // console.log('set start', { newStart, start: rawThis.start, end: rawThis.end })

    if (newStart <= rawThis.#end.value) {
      // Do not overlap previous ranges
      if (rawThis.#list !== null && ! rawThis.#list.overlapEnabled) {
        const previousOverlapingRanges = rawThis.#list.listOverlapingPreviousRanges(rawThis, newStart)
        if (previousOverlapingRanges.length) {
          const previousRangeEnds = previousOverlapingRanges.map(range => range.end)
          const lastPreviousRangesEnd = previousRangeEnds.sort()[ previousRangeEnds.length - 1 ]

          rawThis.#start.value = date.formatDate(
            date.addToDate(new Date(lastPreviousRangesEnd), { days: 1 }),
            'YYYY-MM-DD'
          )
          return
        }
      }
      rawThis.#start.value = newStart
    }
    else { // keep the start before the end
      console.log('set start switch')
      // TODO required?
      rawThis.#start.value = rawThis.#end.value
      rawThis.#end.value = newStart
    }
  }

  set end (newEnd) {
    const rawThis = toRaw(this)
    // console.log('set end', { newEnd, start: rawThis.start, end: rawThis.end })

    if (newEnd >= rawThis.#start.value) {
      // Do not overlap next ranges
      const nextOverlapingRanges = rawThis.#list.listOverlapingNextRanges(rawThis, newEnd)
      if (nextOverlapingRanges.length) {
        const nextRangeStarts = nextOverlapingRanges.map(range => range.start)
        const firstNextRangesStart = nextRangeStarts.sort()[ 0 ]

        rawThis.#end.value = date.formatDate(
          date.subtractFromDate(new Date(firstNextRangesStart), { days: 1 }),
          'YYYY-MM-DD'
        )
        return
      }

      rawThis.#end.value = newEnd
    }
    else {
      console.log('set end switch')
      // TODO required?
      // TODO generates bug during resizes!
      rawThis.#end.value = rawThis.#start.value
      rawThis.#start.value = newEnd
    }
  }

  updateDays () {
    const rawThis = toRaw(this)
    rawThis.#enableNewDaysBetween()
    rawThis.cleanDaysOutside()
    return this
  }

  cleanDaysOutside () {
    const rawThis = toRaw(this)
    for (const day in rawThis.#days) {
      if (day < rawThis.#start.value || day > rawThis.#end.value) {
        delete rawThis.#days[ day ]
      }
    }
  }

  get start () {
    const rawThis = toRaw(this)
    return rawThis.#start.value
  }

  get end () {
    const rawThis = toRaw(this)
    return rawThis.#end.value
  }

  set list (list) {
    const rawThis = toRaw(this)
    rawThis.#list = list
  }

  hasDay (day) {
    const rawThis = toRaw(this)
    // console.log('dayExists', { day, mustExist, days: this.#days, this: this })
    return day in rawThis.#days
  }

  dayIsEnabled (day) {
    const rawThis = toRaw(this)
    return rawThis.#days[ day ].enabled
  }

  enableDay (day) {
    const rawThis = toRaw(this)
    rawThis.#days[ day ].enabled = true
  }

  disableDay (day) {
    const rawThis = toRaw(this)
    rawThis.#days[ day ].enabled = false

    if (day === rawThis.#start.value && day === rawThis.#end.value) {
      rawThis.#list.deleteRange(this)
    }
    else if (day === rawThis.#start.value) {
      rawThis.#start.value = date.formatDate(date.addToDate(new Date(rawThis.#start.value), { days: 1 }), 'YYYY-MM-DD')
      delete rawThis.#days[ day ]
    }
    else if (day === rawThis.#end.value) {
      rawThis.#end.value = date.formatDate(date.subtractFromDate(new Date(rawThis.#end.value), { days: 1 }), 'YYYY-MM-DD')
      delete rawThis.#days[ day ]
    }
  }

  toggleDay (day) {
    const rawThis = toRaw(this)
    rawThis.dayIsEnabled(day) ? rawThis.disableDay(day) : rawThis.enableDay(day)
  }

  get days () {
    const rawThis = toRaw(this)
    return rawThis.#days
  }

  toJSON () {
    const rawThis = toRaw(this)
    const json = {
      start: rawThis.#start.value,
      end: rawThis.#end.value,
      // days: rawThis.#days
    }
    return json
  }
}

export default defineComponent({
  name: 'MiniModeSelection',
  components: {
    NavigationBar,
    QCalendarMonth
  },
  setup () {
    const selectedDate = ref(today()),
      calendar = ref(null),
      anchorTimestamp = ref(null),
      otherTimestamp = ref(null),
      mouseDown = ref(false),
      mobile = ref(false),
      hover = ref(false),
      editedRange = ref(null),
      dateRanges = ref(new DateRangeList),
      currentRangeOrigin = ref(null),
    const startEndDates = computed(() => dateRanges.value.toSelectedStartEndDatesProp())
    const selectedDates = computed(() => dateRanges.value.toSelectedDatesProp())


    editedRange.value = new DateRange('2023-11-06', '2023-11-08')
    editedRange.value.updateDays()
    dateRanges.value.add(editedRange.value)
    editedRange.value = new DateRange('2023-11-16', '2023-11-21')
    editedRange.value.updateDays()
    dateRanges.value.add(editedRange.value)

    function onMouseDownDay ({ scope, event }) {
      if (leftClick(event)) {
        // if (mobile.value === true
        //   && anchorTimestamp.value !== null
        //   && otherTimestamp.value !== null
        //   && anchorTimestamp.value.date === otherTimestamp.value.date) {
        //   otherTimestamp.value = scope.timestamp
        //   mouseDown.value = false
        //   return
        // }

        // mouse is down, start selection and capture current
        mouseDown.value = true
        const clickedDay = scope.timestamp.date
        anchorTimestamp.value = scope.timestamp
        otherTimestamp.value = scope.timestamp

        editedRange.value = null
        currentRangeOrigin.value = null

        // Do not create a new range if click start inside an existing one
        const existingRanges = dateRanges.value.listRangesHavingDayBetween(clickedDay)
        // console.log('existingRanges', JSON.stringify(existingRanges, null, 2))
        if (existingRanges.length > 0) {
          // console.log('Click inside an existing range')
          return
        }

        // Click on the starting day of an existing range
        const rangesStartingOnClickedDay = dateRanges.value.listRangesStartingOn(clickedDay)
        // console.log('rangesStartingOnClickedDay', rangesStartingOnClickedDay)
        if (rangesStartingOnClickedDay.length >= 2 ) {
          throw new Error('Too many ranges starting on the same day: ' + clickedDay)
        }
        else if (rangesStartingOnClickedDay.length > 0) {
          // console.log('Moving start of existing range', clickedDay, rangesStartingOnClickedDay[ 0 ])
          editedRange.value = rangesStartingOnClickedDay[ 0 ]
          anchorTimestamp.value = parseTimestamp(editedRange.value.end)
          currentRangeOrigin.value = 'modified'
        }

        // Click on the ending day of an existing range
        const rangesEndingOnClickedDay = dateRanges.value.listRangesEndingOn(clickedDay)
        // console.log('rangesEndingOnClickedDay', rangesEndingOnClickedDay)
        if (rangesEndingOnClickedDay.length >= 2 ) {
          throw new Error('Too many ranges ending on the same day: ' + clickedDay)
        }
        else if (rangesEndingOnClickedDay.length > 0) {
          // console.log('Moving end of existing range', clickedDay, rangesEndingOnClickedDay[ 0 ])
          editedRange.value = rangesEndingOnClickedDay[ 0 ]
          anchorTimestamp.value = parseTimestamp(editedRange.value.start)
          currentRangeOrigin.value = 'modified'
        }

        // Create a new range
        if (editedRange.value === null && ! scope.outside) {
          // console.log('Create a new range', clickedDay)
          editedRange.value = new DateRange(anchorTimestamp.value.date, otherTimestamp.value.date)
          dateRanges.value.add(editedRange.value)
          currentRangeOrigin.value = 'created'
        }
      }
    }

    const lastMovedOnDate = ref(null)
    function onMouseMoveDay ({ scope, event }) {
      // console.log('scope', deepToRaw(scope))
      if (mouseDown.value === true) {
        // Avoid event repetition
        if (lastMovedOnDate.value === scope.timestamp.date) return
        lastMovedOnDate.value = scope.timestamp.date

        if (editedRange.value === null) {
          return
        }

        otherTimestamp.value = scope.timestamp
        if (otherTimestamp.value.date === anchorTimestamp.value.date) {
          editedRange.value.start = otherTimestamp.value.date
          editedRange.value.end   = otherTimestamp.value.date
        }
        else if (otherTimestamp.value.date > anchorTimestamp.value.date) {
          editedRange.value.start = anchorTimestamp.value.date
          editedRange.value.end   = otherTimestamp.value.date
        }
        else if (otherTimestamp.value.date < anchorTimestamp.value.date) {
          editedRange.value.start = otherTimestamp.value.date
          editedRange.value.end   = anchorTimestamp.value.date
        }
      }
    }

    function onMouseUpDay ({ scope, event }) {
      // console.log('event', event)
      if (leftClick(event)) {
        // mouse is up, capture last and cancel selection
        otherTimestamp.value = scope.timestamp
        mouseDown.value = false
        hover.value = false

        if (editedRange.value === null) {
          return
        }

        editedRange.value.updateDays()
        editedRange.value = null
      }
    }

    function onClickDate (data) {
      console.log('onClickDate', data)
      if (data.scope.outside === true) {
        return
      }

      if (currentRangeOrigin.value === 'created') {
        return
      }

      const clickedDay = data.scope.timestamp.date
      dateRanges.value.toggleDay(clickedDay)
    }


    function onToday () {
      calendar.value.moveToToday()
    }
    function onPrev () {
      calendar.value.prev()
    }
    function onNext () {
      calendar.value.next()
    }
    function onMoved (data) {
      console.log('onMoved', data)
    }
    function onChange (data) {
      console.log('onChange', data)
    }
    function onClickDay (data) {
      console.log('onClickDay', data)
    }
    function onClickWorkweek (data) {
      console.log('onClickWorkweek', data)
    }
    function onClickHeadDay (data) {
      console.log('onClickHeadDay', data)
    }
    function onClickHeadWorkweek (data) {
      console.log('onClickHeadWorkweek', data)
    }

    return {
      selectedDate,
      selectedDates,
      dateRanges,
      calendar,
      mobile,
      hover,
      startEndDates,
      onMouseDownDay,
      onMouseUpDay,
      onMouseMoveDay,
      onToday,
      onPrev,
      onNext,
      onMoved,
      onChange,
      onClickDate,
      onClickDay,
      onClickWorkweek,
      onClickHeadDay,
      onClickHeadWorkweek
    }
  }
})
</script>

<style lang="scss">
.q-calendar-month__day {
  & .q-calendar__button {
    cursor: pointer;
  }
}

.q-calendar-month__day.q-range {
  &.q-selected {
    & .q-calendar__button {
      font-weight: bold;
    }
  }
  &:not(.q-selected) {
    & .q-calendar__button {
    	color: var(--calendar-mini-selected-label-color) !important;
      opacity: 0.5;
    }
  }
}

.q-calendar-month__day.q-range-first,
.q-calendar-month__day.q-range-last {
  &.q-selected {
    & .q-calendar__button {
      font-weight: bold;
    }
  }
}

// Selected Dates outside range must not be displayed during during range resize
.q-calendar-mini .q-calendar-month__day.q-selected:not(.q-range, .q-range-first, .q-range-last) {
  & .q-calendar__button {
    // color: unset !important;
    background-color: unset !important;
  }
}

// Make enabled outside days lighter
.q-calendar-month__day.q-outside {
  opacity: 0.5;
  & .q-calendar__button {
    color: $grey-5;
  }

  &.q-outside-before {
    & .q-calendar__button {
      cursor: w-resize;
    }
  }

  &.q-outside-after {
    & .q-calendar__button {
      cursor: e-resize;
    }
  }
}
</style>
