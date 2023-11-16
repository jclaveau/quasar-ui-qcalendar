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
          mini-mode
          no-active-date
          :selected-start-end-dates="startEndDates"
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
      selectedDates,
      startEndDates,
    }, null, 2) }}</pre>
  </div>
</template>

<script>
import {
  QCalendarMonth,
  // getDayIdentifier,
  today
} from '@quasar/quasar-ui-qcalendar/src/index.js'
import '@quasar/quasar-ui-qcalendar/src/QCalendarVariables.sass'
import '@quasar/quasar-ui-qcalendar/src/QCalendarTransitions.sass'
import '@quasar/quasar-ui-qcalendar/src/QCalendarMonth.sass'
import { deepToRaw } from '@quasar/quasar-ui-qcalendar/src/utils/deepToRaw.js'
import { parseTimestamp } from '@quasar/quasar-ui-qcalendar/src/utils/Timestamp.js'

import {
  defineComponent,
  ref
  // computed
} from 'vue'
import NavigationBar from '../components/NavigationBar.vue'
import { is, date } from 'quasar'

function leftClick (e) {
  return e.button === 0
}

function listDaysBetween(start, end) {
  const out = []
  let dayBetween = new Date(start)
  end = new Date(end)
  let endReached = false
  while (! endReached) {
    out.push(date.formatDate(dayBetween, 'YYYY-MM-DD'))
    endReached = date.isSameDate(end, dayBetween)
    // console.log('listDaysBetween', {start, end, dayBetween, endReached})
    dayBetween = date.addToDate(dayBetween, { days: 1 })
    // console.log('listDaysBetween dayBetween', dayBetween)
  }
  return out
}



export default defineComponent({
  name: 'MiniModeSelection',
  components: {
    NavigationBar,
    QCalendarMonth
  },
  setup () {
    const selectedDate = ref(today()),
      selectedDates = ref(new Set()),
      calendar = ref(null),
      anchorTimestamp = ref(null),
      otherTimestamp = ref(null),
      mouseDown = ref(false),
      mobile = ref(false),
      hover = ref(false),
      startEndDates = ref([]),
      editedRange = ref(null),
      replacedRange = ref(null)

      selectedDates.value.toJSON = () => {
        console.log('!!!!!!!')
        return Array.from(selectedDates.value)
      }
    // const startEndDates = computed(() => {
    //   const dates = []
    //   if (anchorDayIdentifier.value !== false && otherDayIdentifier.value !== false) {
    //     if (anchorDayIdentifier.value <= otherDayIdentifier.value) {
    //       dates.push(anchorTimestamp.value.date, otherTimestamp.value.date)
    //     }
    //     else {
    //       dates.push(otherTimestamp.value.date, anchorTimestamp.value.date)
    //     }
    //   }
    //   return dates
    // })

    // const anchorDayIdentifier = computed(() => {
    //   if (anchorTimestamp.value !== null) {
    //     return getDayIdentifier(anchorTimestamp.value)
    //   }
    //   return false
    // })

    // const otherDayIdentifier = computed(() => {
    //   if (otherTimestamp.value !== null) {
    //     return getDayIdentifier(otherTimestamp.value)
    //   }
    //   return false
    // })

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
        anchorTimestamp.value = scope.timestamp
        otherTimestamp.value = scope.timestamp

        // Do not create a new range if click start inside an existing one
        const containingRange = startEndDates.value.filter(range => {
          return range[ 0 ] < anchorTimestamp.value.date && range[ 1 ] > otherTimestamp.value.date
        })
        if (containingRange.length > 0) {
          return
        }
        // If click starts on the end/start of an existing range, extend it
        // TODO find index
        const existingLeftRangeIndex = startEndDates.value.findIndex(range => {
          return range[ 0 ] === anchorTimestamp.value.date
        })
        if (existingLeftRangeIndex >= 0) {
          console.log('Move left')
          const existingRange = startEndDates.value[ existingLeftRangeIndex ]
          anchorTimestamp.value = parseTimestamp(existingRange[ 1 ])
          editedRange.value = [otherTimestamp.value.date, existingRange[ 1 ]]
          startEndDates.value.push(editedRange.value)
          startEndDates.value.splice(existingLeftRangeIndex, 1)
          return
        }

        const existingRightRangeIndex = startEndDates.value.findIndex(range => {
          return range[ 1 ] === anchorTimestamp.value.date
        })
        if (existingRightRangeIndex >= 0) {
          console.log('Move right')
          const existingRange = startEndDates.value[ existingRightRangeIndex ]
          anchorTimestamp.value = parseTimestamp(existingRange[ 0 ])
          // console.log('existingRange', existingRange)
          // console.log('MouseDown anchorTimestamp', toRaw(anchorTimestamp.value))

          editedRange.value = [otherTimestamp.value.date, existingRange[ 0 ]]
          // console.log('MouseDown editedRange', JSON.stringify(editedRange.value))
          startEndDates.value.push(editedRange.value)
          replacedRange.value = startEndDates.value.splice(existingRightRangeIndex, 1)[ 0 ]
          return
        }


        editedRange.value = [anchorTimestamp.value.date, otherTimestamp.value.date]
        startEndDates.value.push(editedRange.value)
      }
    }

    function onMouseMoveDay ({ scope, event }) {
      // console.log('scope', deepToRaw(scope))
      // if (mouseDown.value === true && scope.outside !== true) {
      if (mouseDown.value === true) {
        otherTimestamp.value = scope.timestamp

        if (editedRange.value === null) {
          return
        }

        const otherRanges = startEndDates.value.filter(range => {
          return ! is.deepEqual(deepToRaw(range), deepToRaw(editedRange.value))
        })

        // if (! otherRanges.value?.length) {
        //   editedRange.value[0] = otherTimestamp.value.date
        //   return
        // }
        // console.log('otherRanges', otherRanges)

        // console.log('MouseMove anchorTimestamp', toRaw(anchorTimestamp.value))

        if (otherTimestamp.value.date < anchorTimestamp.value.date) {
          const previousRangeEnds = otherRanges.map(range => range[ 1 ]).filter(range => range < anchorTimestamp.value.date)
          const lastRangeEnd = previousRangeEnds.sort()[ previousRangeEnds.length - 1 ]
          // console.log('lastRangeEnd', {
          //   // previousRangeEnds,
          //   lastRangeEnd,
          //   hovered: otherTimestamp.value.date,
          //   ok: lastRangeEnd === undefined || lastRangeEnd < otherTimestamp.value.date
          // })
          if (lastRangeEnd === undefined || lastRangeEnd < otherTimestamp.value.date) {
            editedRange.value[0] = otherTimestamp.value.date
          } else {
            editedRange.value[0] = date.formatDate(
              date.addToDate(new Date(lastRangeEnd), { days: 1 }),
              'YYYY-MM-DD'
            )
          }
        }
        else {
          const nextRangeStarts = otherRanges.map(range => range[ 0 ]).filter(range => range > anchorTimestamp.value.date)
          const firstRangeStart = nextRangeStarts.sort()[ 0 ]
          // console.log('firstRangeStart', {
          //   // nextRangeStarts,
          //   firstRangeStart,
          //   hovered: otherTimestamp.value.date,
          //   ok: firstRangeStart === undefined || firstRangeStart > otherTimestamp.value.date
          // })
          if (firstRangeStart === undefined || firstRangeStart > otherTimestamp.value.date) {
            editedRange.value[0] = otherTimestamp.value.date
          } else {
            editedRange.value[0] = date.formatDate(
              date.subtractFromDate(new Date(firstRangeStart), { days: 1 }),
              'YYYY-MM-DD'
            )
          }
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
        editedRange.value.sort()

        const datesToSelect = listDaysBetween(editedRange.value[ 0 ], editedRange.value[ 1 ])
        // // console.log('datesToSelect', datesToSelect)
        // selectedDates.value = new Set([ ...selectedDates.value, ...datesToSelect ])
        datesToSelect.forEach(date => selectedDates.value.add(date))
        console.log('selectedDates', selectedDates.value)
        // TODO use Timestamp.js / createDayList() ?

        // TODO remove selectedDates out of range

        console.log('MouseUp editedRange', JSON.stringify(editedRange.value))
        editedRange.value = null
      }
    }

    function onClickDate (data) {
      console.log('onClickDate', data)

      // Select a date by clicking on it
      selectedDates.value.has(data.scope.timestamp.date)
        ? selectedDates.value.delete(data.scope.timestamp.date)
        : selectedDates.value.add(data.scope.timestamp.date)

      // Shorten range by clicking on its edges
      const existingLeftRangeIndex = startEndDates.value.findIndex(range => {
        return range[ 1 ] === anchorTimestamp.value.date
      })
      if (existingLeftRangeIndex >= 0) {
        console.log('Click left')
        const existingRange = startEndDates.value[ existingLeftRangeIndex ]
        const leftSqlDate = existingRange[ 0 ]

        if (leftSqlDate === existingRange[ 1 ]) {
          startEndDates.value.splice(existingLeftRangeIndex, 1)
        }
        else {
          existingRange[ 0 ] = date.formatDate(date.addToDate(new Date(leftSqlDate), { days: 1 }), 'YYYY-MM-DD')
        }

        selectedDates.value.delete(leftSqlDate)
        return
      }

      const existingRightRangeIndex = startEndDates.value.findIndex(range => {
        return range[ 0 ] === anchorTimestamp.value.date
      })
      if (existingRightRangeIndex >= 0) {
        console.log('Click right')
        const existingRange = startEndDates.value[ existingRightRangeIndex ]
        const rightSqlDate = existingRange[ 1 ]

        if (rightSqlDate === existingRange[ 0 ]) {
          startEndDates.value.splice(existingLeftRangeIndex, 1)
        }
        else {
          existingRange[ 1 ] = date.formatDate(date.subtractFromDate(new Date(rightSqlDate), { days: 1 }), 'YYYY-MM-DD')
        }

        selectedDates.value.delete(leftSqlDate)
        return
      }



      if (editedRange.value !== null) {
        startEndDates.value.splice(startEndDates.value.indexOf(editedRange.value), 1)
      }
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

</style>
