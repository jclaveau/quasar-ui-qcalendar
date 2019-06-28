(window["webpackJsonp"]=window["webpackJsonp"]||[]).push([["d99106a2"],{2514:function(e,n,t){"use strict";var a=function(){var e=this,n=e.$createElement,t=e._self._c||n;return t("div",[t("section",{staticClass:"page-header"},[t("h1",{staticClass:"project-name"},[e._v("QCalendar")]),t("h2",{staticClass:"project-tagline"}),t("q-btn",{staticClass:"btn",attrs:{type:"a",href:"https://github.com/quasarframework/app-extension-qcalendar",target:"_blank",label:"View on GitHub","no-caps":"",flat:""}}),t("q-btn",{staticClass:"btn",attrs:{to:"/docs",label:"Docs","no-caps":"",flat:""}}),t("q-btn",{staticClass:"btn",attrs:{to:"/examples",label:"Examples","no-caps":"",flat:""}}),t("q-btn",{staticClass:"btn",attrs:{to:"/demo",label:"Interactive Demo","no-caps":"",flat:""}})],1),t("main",{staticClass:"flex flex-start justify-center inset-shadow"},[t("div",{staticClass:"q-pa-md col-12-sm col-8-md col-6-lg inset-shadow",staticStyle:{width:"100%",height:"3px"}}),t("div",{staticClass:"q-pa-md col-12-sm col-8-md col-6-lg bg-white shadow-1",staticStyle:{"max-width":"800px",width:"100%"}},[e._t("default")],2)])])},o=[],r={name:"Hero"},i=r,s=t("2877"),d=Object(s["a"])(i,a,o,!1,null,null,null);n["a"]=d.exports},"8b24":function(e,n,t){"use strict";t.r(n);var a=function(){var e=this,n=e.$createElement,t=e._self._c||n;return t("hero",[t("q-markdown",{attrs:{src:e.markdown,toc:""},on:{data:e.onToc}})],1)},o=[],r=t("2514"),i='QCalendar\n===\n\n> Please note, this is currently a work-in-progress (WIP).\n\n\nQCalendar is a [Quasar App Extension](https://quasar.dev/app-extensions/introduction). It is a powerful calendar component that plugs right into your Quasar application and allows for both day (1-7 days for a week) and monthly views. Painstaking care has been given to make almost every aspect of QCalendar configurable and/or modifiable in some way and control given to the developer.\n\nQCalendar is a less-opinionated calendar component, as it does not keep track of things like events, reminders or even disabled days (if that\'s what you want). This is in the hands of the developer, but QCalendar makes it easy via accessible events, slots and methods.\n\nThe guiding philosophy has been to empower the developer and allow them to do what needs to be done without being overly opinionated. In order to do this, the following items are followed:\n\n1. Separation of concerns\n2. Minimalization\n3. Closed to change, but open for extension\n\nThis is the true power of QCalendar.\n\n# Features\n- Show month, week, day, contiguous days (ex: 3 days at a time)\n- Optional drag and drop support (including mobile)\n- Automatic localization / internationalization\n- Responsive flex grid layout\n- No external dependencies (momentjs, jQuery, etc), other than Quasar\n- User events support (date, day, interval, time)\n- Resource scheduler\n- Define any day as beginning of week\n- Show only certain days of the week (good for work week days)\n- Workweek number support\n- Day-of-the-year support\n- Easy to theme using CSS overrides or using JSON theme object (see Themes below)\n- Easy to customize with Vue slots\n\n## QCalendar is not...\n- An event management system. However, you can easily do this in devland with QCalendar\'s slots.\n- A navigation provider (next, previous, today). However, you can easily do this in devland with QCalendar\'s methods.\n- Currently there is no Agenda view, although it is up for consideration.\n- Only the Gregorian calendar is supported.\n\nThis work is currently in `beta` and there are expected changes while things get worked out. Your help with testing is greatly appreciated.\n\n# Install\nTo add this App Extension to your Quasar application, run the following (in your Quasar app folder):\n```\nquasar ext add @quasar/qcalendar\n```\n\n::: tip\nQCalendar will try to take up all available space that it is in. The parent should have a fixed height and have a css `position: relative`.\n:::\n\n# Uninstall\nTo remove this App Extension from your Quasar application, run the following (in your Quasar app folder):\n```\nquasar ext remove @quasar/qcalendar\n```\n\n# Describe\nYou can use `quasar describe QCalendar` (to be implemented before QCalendar v1 release)\n\n# Docs\nCan be found [here](https://quasarframework.github.io/app-extension-qcalendar).\n\n# Examples\nCan be found [here](https://quasarframework.github.io/app-extension-qcalendar/examples).\n\n# Interactive Demo\nCan be found [here](https://quasarframework.github.io/app-extension-qcalendar/demo).\n\n# Demo (source) Project\nCan be found [here](https://github.com/quasarframework/app-extension-qcalendar/tree/master/demo).\n\n# Working with QCalendar\n\nIn order to get the best potential from QCalendar it is important to understand all aspects which will be described below.\n\nFirst and foremost, the native date format used internally, and with the v-model, is `YYYY-mm-dd`. This is to avoid confusion with positioning of the day and month in other date formats as well as date separator. All incoming and outgoing dates will use this format.\n\nThe default locale of QCalendar is **en-us**. This can easily be changed via the `locale` property. Any area of QCalendar that displays text and numbers is locale-aware.\n\nYou will see a number of images below which have the QCalendar component, but the title bar above all images is not part QCalendar. This is something a developer would provide in devland.\n\n![WeekView](statics/qcalendar-toolbar.png "Week View" =800x800)\n\nYou would need to build out your own way of allowing the User to interact with QCalendar (if that is what you wish). Or, keep a fixed calendar.\n\n# Anatomy of a calendar\n\nA calendar is made from two distict components: day and month views. All other views derive from these two views.\n\n## Day view\n\n![DayView](statics/qcalendar-day-view.png "Day View" =800x800)\n\nThe day view is for displaying time intervals on the left side and 1 or more days in a contiguous fashion on the right side. The top-left portion is the `interval header`. The intervals themselves comprise of the `interval body` and the text within that is the `interval label`. To the right, is one or more days. It comprises of the `day header` which contains `day header weekday` and `day header label`. Right below that is the `day header content`. Below the day header, is the `day intervals`.\n\nWhen more than one day is displayed:\n\n![WeekView](statics/qcalendar-week-view.png "Week View" =800x800)\n\n## Custom Interval view\n\nThe `custom-interval` view allows you to display as many days as specified by the property `maxDays`. This can get a bit busy if a large number of days are displayed and is only recommended for wide screens. The imnage below has `maxDays` set to 14. \n\n![CustomInterval](statics/qcalendar-custom-interval-view.png "Custom Interval" =800x800)\n\n## Month Interval view\n\nThe `month-interval` view allows you to display all days in a month while in the interval mode. This can get a bit busy and is only recommended for wide screens.\n\n![MonthInterval](statics/qcalendar-month-interval-view.png "Month Interval" =800x800)\n\n## Month view\n\n![MonthView](statics/qcalendar-month-view.png "Month View" =800x800)\n\nThe month view is for displaying a finite number of weeks according to the calendar time which is the currently displayed month. For time periods which fall outside of the current month, yet are still displayed (beginning and ending days of the month view), these are known as the `outside` days. The current date is known as the `current` day (obviously). Days leading up to the current date are known as `past` days and days that come after the current date are known as `future` days.\n\nThe weekly view comprises of a header `weekly header` which is segmented by a `weekday header` for each day of the week that is to be displayed. For each day in the display this is called the `weekly day`, which can have a sub-nature of `outside`, `past`, `current` or `future`. The text (day of the month) displayed is the `weekly day label`.\n\n## Scheduler view\n\n![SchedulerView](statics/qcalendar-scheduler-view.png "Scheduler View" =800x800)\n\nThe scheduler view is for displaying days with resources on the left side. This allows you to present data for each resource. Where a resource could be a person, room, etc.\n\nTo use the scheduler, you need to use the `resources` property, which currently is an array of objects, containing a single key `label`. To change the number of days displayed, use the `max-days` property.\n\n\n## View types\n\nQCalendar has several `view` types available. They are: `month`, `week`, `day`, `2day`, `3day`, `4day`, `5day`, `6day`, `custom-interval`, `month-interval` and `scheduler`. It\'s important to know that all day `view` types are linear in nature. For instance, `3day` will show three days and `next` will show the next 3 days. You can switch to a `view` type on a mobile based on the current width of the screen. For portrait mode, you could change the `view` type to `2day` and for landscape mode `4day`. When `next` or `prev` is called the next (or previous) 2 days (for protrait) or 4 days (for landscape) would be displayed.\n\n## Weekday filtering\n\nQCalendar supports weekday filtering using the `weekdays` property. This is an array of numbers representing the days of the week, where `0` is Sunday and `6` is Saturday. The default looks like this: `[0, 1, 2, 3, 4, 5, 6]`.\n\nIf the desire was to display only the work week (meaning Monday to Friday), the `weekdays` property would be set like this: `[1, 2, 3, 4, 5]`.\n\n![Week5day](statics/qcalendar-week-view-5day.png "Week 5 day" =800x800)\n\n![Month5day](statics/qcalendar-month-view-5day.png "Month 5 day" =800x800)\n\nAs well, if the goal was to display Monday as the first day of the week (as does the German calendar), the `weekdays` property would be set like this: `[1, 2, 3, 4, 5, 6, 0]`.\n\n![WeekMondayFirstDay](statics/qcalendar-week-view-monday-first-day.png "Week - Monday First Day" =800x800)\n\n![MonthMondayFirstDay](statics/qcalendar-month-view-monday-first-day.png "Month - Monday First Day" =800x800)\n\n**Expected Results**\nIf you are trying to do a 5-day week always use the `week` and `month` views to do the filtering. The `2day` to `5day` filters are linear and won\'t give you the expected results.\n\nThis image has set up a 5-day work week (`[1, 2, 3, 4, 5]`) incorrectly using a `5day` filter.\n\n![Incorrect5Day](statics/qcalendar-5day-done-incorrectly.png "5 Day - Set up incorrectly" =800x800)\n\n## Workweek numbers\nQCalendar supports workweek numbers (also known as [ISO week date](https://en.wikipedia.org/wiki/ISO_week_date)). That is, the numbered week from the start of the year.\n\n![WorkWeek](statics/qcalendar-workweeks.png "Workweek or ISO Week Date" =800x800)\n\n# Navigation\n\nNavigating QCalendar can be done in several ways:\n\n1. Setting the `value` (v-model) property\n2. Setting the `now` property\n3. Calling `next()` and `prev()` functions\n4. Calling the `move()` function\n5. Calling the `updateCurrent()` function\n\nOut of this, the most common would be to use the `next()` and `prev()` functions.\n\n```html\n<q-calendar ref="calendar" ...\n```\n\nand then in JavaScript:\n\n```js\n  methods: {\n    calendarNext () {\n      this.$refs.calendar.next()\n    },\n    calendarPrev () {\n      this.$refs.calendar.prev()\n    },\n```\n\n## Swipe navigation\n\nQCalendar does not provide swipe navigation out-of-the-box. The philosophy is to allow the developer to make navigation choices and availability. However, with **Quasar** it is quite easy to add swipe navigation to your calendar.\n\nFirst, in your `quasar.conf.js` make sure to add `TouchSwipe` to your directives.\n\n```js\ndirectives: [\n  \'Ripple\',\n  \'ClosePopup\',\n  \'TouchSwipe\'\n],\n```\n\nThen on your `q-calendar` component, add the following:\n\n```html\n<q-calendar\n  ref="calendar"\n  v-touch-swipe.mouse.left.right="handleSwipe"\n  ...\n```\n\nAnd, finally, in your JavaScript, handle the `handleSwipe` function:\n\n```js\nhandleSwipe ({ evt, ...info }) {\n  if (this.dragging === false) {\n    if (info.duration >= 30) {\n      if (info.direction === \'right\') {\n        this.calendarPrev()\n      } else if (info.direction === \'left\') {\n        this.calendarNext()\n      }\n    }\n  }\n  stopAndPrevent(evt)\n}\n```\nSee the Demo code for more information (link at top of page).\n\n# Locale\n\nQCalendar supports locales as defined within the browser and can be changed by setting the `locale` property. If an invalid locale is used, the fallback locale of **en-us** will be used.\n\n![Arabic](statics/qcalendar-locale-arabic.png "Locale - Arabic" =800x800)\n![Chinese](statics/qcalendar-locale-chinese.png "Locale - Chinese" =800x800)\n![French](statics/qcalendar-locale-french.png "Locale - French" =800x800)\n![German](statics/qcalendar-locale-german.png "Locale - German" =800x800)\n![Romanian](statics/qcalendar-locale-romanian.png "Locale - Romanian" =800x800)\n\n# Themes\n\nQCalendar has the ability to work with themes. It does not come with any itself, but you can download the ones that are used in the demo [here](statics/themes.js).\n\nAll colors in themes can be from the [Quasar Color Pallete](https://quasar.dev/style/color-palette) or a CSS color (#, rgb, rgba, hls, etc).\n\nDownload and look at the themes to see what is needed. If a property is missing from a theme, then the fallback of the default CSS will be used.\n\n![ThemeDark](statics/qcalendar-theme-dark.png "Theme - Dark" =800x800)\n![ThemeTeal](statics/qcalendar-theme-teal.png "Theme - Teal" =800x800)\n![ThemeBrown](statics/qcalendar-theme-brown.png "Theme - Brown" =800x800)\n![ThemeDeepPurple](statics/qcalendar-theme-deep-purple.png "Theme - Deep Purple" =800x800)\n![ThemeIndigo](statics/qcalendar-theme-indigo.png "Theme - Indigo" =800x800)\n![ThemeBlue](statics/qcalendar-theme-blue.png "Theme - Blue" =800x800)\n\n\n# Animating\n\nAnimation is when QCalendar does a `prev` or `next` action. Setting the property `:animated="true"` turns on the animation. Two other properties, `transition-prev` and `transition-next` allow you to set the type of transition to use. The default is to use `transition-prev="slide-right"` and `transition-next="slide-left"`, but you can use any of the [Quasar transitions](https://quasar.dev/options/transitions), or build your own (see [Vue transitions](https://vuejs.org/v2/guide/transitions.html) for detailed information).\n\n# Drag and Drop support\nQCalendar supports HTML5 **drag and drop**. If you have components that need drag and drop support you can add the following (this example is using QBadge):\n\n```html\n<template v-slot:day="{ date }">\n  <template v-for="(event, index) in getEvents(date)">\n    <q-badge\n      :key="index"\n      style="width: 100%; cursor: pointer;"\n      class="ellipsis"\n      :class="badgeClasses(event, \'day\')"\n      :style="badgeStyles(event, \'day\')"\n      @click.stop.prevent="showEvent(event)"\n      :draggable="true"\n      @dragstart.native="(e) => onDragStart(e, event)"\n      @dragend.native="(e) => onDragEnd(e, event)"\n      @dragenter.native="(e) => onDragEnter(e, event)"\n      @touchmove.native="(e) => {}"\n    >\n      <q-icon v-if="event.icon" :name="event.icon" class="q-mr-xs" /><span class="ellipsis">{{ event.title }}</span>\n    </q-badge>\n  </template>\n</template>\n```\nRemember, to kick off a drag and drop, you must `preventDefault` during the `dragenter` event:\n\n```js\nonDragEnter (ev, event) {\n  prevent(ev)\n},\nonDragStart (ev, event) {\n  this.dragging = true\n  this.draggedEvent = event\n  stop(ev)\n},\nonDragEnd (ev, event) {\n  stopAndPrevent(ev)\n  this.resetDrag()\n},\nonDragOver (ev, day, type) {\n  if (type === \'day\') {\n    stopAndPrevent(ev)\n    return this.draggedEvent.date !== day.date\n  } else if (type === \'interval\') {\n    stopAndPrevent(ev)\n    return this.draggedEvent.date !== day.date && this.draggedEvent.time !== day.time\n  }\n},\nonDrop (ev, day, type) {\n  ev.preventDefault()\n  ev.stopPropagation()\n  if (type === \'day\') {\n    this.draggedEvent.date = day.date\n    this.draggedEvent.side = void 0\n  } else if (type === \'interval\') {\n    this.draggedEvent.date = day.date\n    this.draggedEvent.time = day.time\n    this.draggedEvent.side = void 0\n  }\n},\nresetDrag () {\n  this.draggedEvent = void 0\n  this.dragging = false\n  if (Platform.is.desktop) {\n    this.ignoreNextSwipe = true\n  }\n}\n```\n\n## Mobile support\nDrag and drop is typically not directly supported on mobile browsers. If you want support, add the package `drag-drop-touch` to your `package.json`. And then, just `import \'drag-drop-touch\'` to get it to shim into your code. When using this shim, you need the `@touchmove.native="(e) => {}"` as noted above to prevent issues with iOS.\n\n# Working with Slots\nTODO\n\n# QCalendar API\n\n## Vue Properties\n\n| Vue Property | Type | View | Description |\n| --- | --- | --- | --- |\n| view | String | All | The currently displayed view<br>Default: "month"<br>Choices: [\'month\', \'week\', \'day\', \'2day\', \'3day\', \'4day\', \'5day\', \'6day\', \'custom-interval\', \'month-interval\', `scheduler`] |\n| value | String| All | v-model used to pass in a date and time value<br>Default: now<br>Format: \'YYYY-mm-dd  HH:mm\' |\n| now | String | All | Date and time value representing a fixed date in time<br>Default: today\'s date |\n| color | String | All | Overrides color to be used for current date or `now`<br>Default: false<br>This can be any CSS color value or Quasar color |\n| enable-themes | Boolean | All | Allows themes to be used<br>Default: false<br>Note: turning this on is a performace hit |\n| theme | Object | All | Overrides the calendar\'s color properties |\n| weekdays | Array | All | The days of the week to be displayed<br>Default: [0, 1, 2, 3, 4, 5, 6]<br>0=Sunday, 1=Monday, 2=Tuesday, etc |\n| hide-header | Boolean| All | Hide the calendar header<br>Default: false |\n| short-weekday-label | Boolean | All | Makes the days of the week short<br>Default: false<br>Sunday=Sun, Monday=Mon, Tuesday=Tue, etc |\n| locale | String | All | Changes the calendar\'s locale<br>Default: en-us |\n| animated | Boolean | All | Makes the calendar\'s prev/next animated<br>Default: false |\n| transition-prev | String | All | The transition to use for **prev** when `animated` is true<br>Default: slide-right |\n| transition-next | String | All | The transition to use for **next** when `animated` is true<br>Default: slide-left |\n| drag-over-func | Function | All | The function that will be called when dragging over a calendar\'s drop spot<br>dragOverFunc(e, day, \'day\', index)<br>`index` is valid only if `column-count` is set > 1 in `day` view mode |\n| drop-func | Function | All | The function that will be called when dropping on a calendar\'s drop spot<br>dropFunc(e, day, \'day\', index)<br>`index` is valid only if `column-count` is set > 1 in `day` view mode |\n| | | | **Day properties** |\n| no-scroll | Boolean| Day | Hide the scrollbar<br>Default: false |\n| column-header-before | Boolean| Day | Provide a column before scoped slot<br>Default: false |\n| column-header-after | Boolean| Day | Provide a column after scoped slot<br>Default: false |\n| column-count | Boolean| Day | Show the same day x number of times in columns. Scoped slots get this data as `index` in passed object<br>Default: 1 |\n| column-index-start | [Number, String]| Day | Starting index. This allows you to create a paging system (next/prev) when using `column-count` property<br>Default: 0 |\n| short-interval-label | Boolean | Day | Makes interval labels short<br>Default: false |\n| interval-height | [Number, String] | Day | The maximum height in pixels for the interval height<br>Default: 40 |\n| interval-minutes | [Number, String] | Day | The number of minutes in an interval<br>Default: 60<br>15 and 30 logically be other choices |\n| interval-count | [Number, String] | Day | The number intervals to use<br>Default: 24<br>If `interval-minutes` is set to `30` then you would set `interval count` to `48` -- double that of regular |\n| interval-start | [Number, String] | Day | The starting interval<br>Default: 0 |\n| hour24-format | Number | Day | Show intervals in 24 hour format<br>Default: false<br>If `false` the interval time shows in the selected locale |\n| | | | **Month properties** |\n| day-height | Number | Month | The maximum height in pixels for the day height<br>Default: 50 |\n| day-padding | String | Month | Overrides the padding to be used for a day element<br>Default: in the CSS "**48px 2px**" |\n| min-weeks | Number | Month | The minimum number of weeks to be displayed<br>Default: 1 |\n| short-month-label | Boolean | Month | Makes the month label short<br>Default: false<br>January=Jan, February=Feb, March=Mar, etc |\n| show-work-weeks | Boolean | Month | Show work weeks<br>Default: false |\n| show-month-label | Boolean | Month | Shows the month label - this occurs on the 1st of the month<br>Default: true |\n| show-day-of-year-label | Boolean | Month | Show the say of the year - this occurs in the top right of each day element. If `show-month-label` is `true`, then that day is skipped<br>Default: false |\n| show-work-weeks | Boolean | Month | Show work weeks<br>Default: false |\n| | | | **Scheduler properties** |\n| resources | Array | Scheduler  | An array of objects with a single key of `label`. You can add other keys if you like, which will be passed in on the appropriate slots |\n| | | | **Other properties** |\n| max-days | Number | Custom, Scheduler  | The maximum number of days to be displayed. Ignored for most other views<br>Default: 7 |\n\n\n## Vue Events\n| Vue Event | Args | Description |\n| --- | --- | --- |\n| change | { start, end } | |\n| input | YYYY-mm-dd | |\n| click:context |  | |\n| contextmenu:context |  | |\n| mousedown:context |  | |\n| mouseup:context |  | |\n| mouseenter:context |  | |\n| mouseleave:context |  | |\n| mousemove:context |  | |\n| touchstart:context |  | |\n| touchend:context |  | |\n| touchmove:context |  | |\n\n`context` can be one of the following:\n1. date\n2. day\n3. interval\n4. time\n5. resource (for Scheduler view only)\n\n## Vue Methods\n| Vue Method | Args | Description |\n| --- | --- | --- |\n| next | --- | Goes to the next iteration |\n| prev | --- | Goes to the previous iteration |\n| move |  Number | Moves forwards or backwards for count iterations, depending on positive (forwards) or negative (backwards) value|\n| updateCurrent | --- | Update various values to be consistent with current date |\n\n## Vue Slots\n| Vue Method | View | Data | Description |\n| --- | --- | --- | --- |\n| day-header | Day | day | index is added if using `column-count` property |\n| day-body | Day | day | index is added if using `column-count` property |\n| intervals-header | Day | day[ ] | |\n| interval | Day | { timeStartPos, timeDurationHeight, ...day } | index is added if using `column-count` property |\n| column-header-before | Day | day |\n| column-header-after | Day | day | index is added if using `column-count` property |\n| | | | **Month** |\n| day | Month | { outside, ...day } | |\n| day-label | Month | { dayLabel, ...day } | |\n| day-body | Month | { timeStartPos, timeDurationHeight, ...day } | |\n| month-label | Month | { monthLabel, ...day } | |\n| day-of-year | Month | day | |\n| workweek-label | Month | { workweekLaabel, week } | |\n| | | | **Scheduler** |\n| scheduler-resources-header | Scheduler | TBD | |\n| scheduler-day-header | Scheduler | TBD | |\n| scheduler-column-header-before | Scheduler | TBD | |\n| scheduler-column-header-after | Scheduler | TBD | |\n| scheduler-day-body | Scheduler | TBD | |\n| scheduler-resource | Scheduler | TBD | |\n\n# Donate\nIf you appreciate the work that went into this App Extension, please consider [donating to Quasar](https://donate.quasar.dev).\n\n---\nThis page created with [QMarkdown](https://quasarframework.github.io/app-extension-qmarkdown), another great Quasar App Extension.',s={name:"PageIndex",components:{Hero:r["a"]},data:function(){return{markdown:i}},computed:{toc:{get:function(){return this.$store.state.common.toc},set:function(e){this.$store.commit("common/toc",e)}}},methods:{onToc:function(e){this.toc=e}}},d=s,l=t("2877"),h=Object(l["a"])(d,a,o,!1,null,null,null);n["default"]=h.exports}}]);