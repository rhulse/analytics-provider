# Analytics Provider

## Overview

Analytics Provider allows application actions and events to be sent to mulitple analyitcs providers without having to manually add mulitlple javascript trackers to your application.

A provider for Google Analytics is included as part of this package, with Elastic Stack (log stash) in development.

The names of functions and data payloads are broadly modeled after Google's API, but can be extended as needed.

## Use

### Basic Setup

```
// analytics.js

import { AnalyticsDispatcher, GoogleGA } from "analytics-provider";

const googleProvider = new GoogleGA({
  providerId: 'YOUR_GOOGLE_ID',
});

export const analytics = new AnalyticsDispatcher({
  providers: [googleProvider],
});
```

Then import the analytics object and call methods as needed.

```
import { analytics } from "analytics";

const content = () = {

  analytics.pageView("content-page")

}
```

### With all params set to defaults

```
const googleProvider = new GoogleGA({
  providerId: [ID],
  loggingLevel: 0,
  debug: false,
});

export const analytics = new AnalyticsDispatcher({
  providers: [googleProvider],
  loggingLevel: 0,
  trackPageTime: false,
  trackSessionTime: false,
  idleTimeout: 0,
  adjustSessionTimingForTimeout: false,
  kioskHomePage: null
});
```

### Calling Analytics

## Methods

`setLanguage(language)`

Sets the current language registered in the providers

`changeLanguage(language)`

Changes the current language registered in the providers

This also sends an Langage Change event.

`setPage(url)`

This sets the current page in the provider, but does not register a view.

`pageView(url, noSet)`

Sends a page view

The dispatcher always sends a pair of commands - setPage and pageView. setPage is required in single page applications to ensure that the current event context is known to the provider. (ref: [Tracking Virtual Pageviews](https://developers.google.com/analytics/devguides/collection/analyticsjs/single-page-applications#tracking_virtual_pageviews) )

It's also to allow other providers to register the current page context and handle that in their own way. For example, if you were sending analytics data to Elastic Stack, you might want to know on what page an event fired. Without setPage this infomation is not known.

`timing(timingData)`

Sends a timing event.

`setAppVersion(version)`

Sets the application version.

`setAppName(name)`

Sets the application name.

`setAppId(Id)`

Sets the application ID.

`setUserId(Id)`

Sets the user identifier.

`startSession({withEvent: false})`

Start a session.

Google Analytics manages the begining and end of sessions itself. This method can be called in a single page application that is running persistently, such as a kiosk.

`endSession()`

End a session. This can be called in a single page application when the screen saver starts.

## Museum Use

This package was extracted out of my Kiosk Application Framework, and has additional functionality that is useful in a museum context.

`trackPageTime`

Tracks the length of time spent on each page (apart from the last page in a session).

`trackSessionTime`

Tracks the length of session using the beforeunload event.

`kioskHomePage`

The path to the home page of the application. The assumption is that the kiosk will reset to this page after a timeout, and that `endSession()` will be called when that happens. The session end events use a fake URL (/session-end) so as not to pollute real page view stats.

`idleTimeout`

Time in mS before the app's screensaver kicks in.

`adjustSessionTimingForTimeout`

Estimate the length of the session based on when the screensaver kicks in and an average of pageView times.

The session duration time is usually the time from the first page view until the session ends (times out). The problem with using this is that someone will read the last page of their session and walk away. The session time will incude the time between when they walked away and the time out. If they did not spend long reading, perhaps just a minute, the session time will be inflated. Looking at session times as a group, the lower limit of session times (short ones) will be higher than it should be.

This parameter adjusts the session time, based on a statistical guess. It does the following:

```
adjustedSessionTime = sessionTime - idleTimeout + (averagePageViewDuration + one standard deviation)
```

THIS IS A GUESS based on experience and observation. You'll need to confirm it for youself, but at the very least you won't, on average, have session times inflated by the timeout between the user walking away and the screensaver starting. The duration of this extra page time is **not** sent to the analytics provider.

You can set the analytics logging level to `2` to see the results of this adjustment printed in the console.
