"use client";

import Script from "next/script";
import {
  POSTHOG_ENABLED,
  POSTHOG_HOST,
  POSTHOG_PROJECT_TOKEN,
} from "@/lib/analytics/policy";

function buildPostHogBootstrap(): string {
  const token = JSON.stringify(POSTHOG_PROJECT_TOKEN);
  const host = JSON.stringify(POSTHOG_HOST);

  return `
(function(d,w){
  var ph=w.posthog=w.posthog||[];
  if(ph.__SV){return;}
  ph._i=[];
  ph.init=function(token,config,name){
    function stub(target,method){
      target[method]=function(){
        target.push([method].concat(Array.prototype.slice.call(arguments,0)));
      };
    }
    var script=d.createElement("script");
    script.type="text/javascript";
    script.async=true;
    script.crossOrigin="anonymous";
    script.src=config.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js";
    var first=d.getElementsByTagName("script")[0];
    first.parentNode.insertBefore(script,first);

    var instance=ph;
    if(name!==undefined){
      instance=ph[name]=[];
    } else {
      name="posthog";
    }

    instance.people=instance.people||[];
    instance.toString=function(asPeople){
      var label="posthog";
      if(name!=="posthog"){label+="."+name;}
      if(!asPeople){label+=" (stub)";}
      return label;
    };
    instance.people.toString=function(){return instance.toString(1)+".people (stub)";};

    var methods="init capture register register_once register_for_session unregister unregister_for_session getFeatureFlag getFeatureFlagPayload isFeatureEnabled updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSurveysLoaded onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey identify setPersonProperties group reset set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty get_session_id get_session_replay_url debug get_distinct_id getGroups get_session_recording_url_and_duration".split(" ");
    for(var i=0;i<methods.length;i++){stub(instance,methods[i]);}
    ph._i.push([token,config,name]);
  };
  ph.__SV=1;
})(document,window);

window.posthog.init(${token},{
  api_host:${host},
  defaults:"2026-05-30",
  autocapture:true,
  capture_pageview:false,
  capture_pageleave:true,
  person_profiles:"identified_only"
});

if(window.__posthogResetPending){
  window.posthog.reset();
  window.__posthogResetPending=false;
}
var identities=window.__posthogIdentifyQueue||[];
for(var i=0;i<identities.length;i++){
  window.posthog.identify(identities[i][0],identities[i][1]);
}
window.__posthogIdentifyQueue=[];
var queued=window.__posthogCaptureQueue||[];
for(var j=0;j<queued.length;j++){
  window.posthog.capture(queued[j][0],queued[j][1]);
}
window.__posthogCaptureQueue=[];
`.trim();
}

/**
 * Loads the PostHog browser SDK without adding a package dependency.
 * The existing analytics wrapper owns explicit SPA pageviews and curated product events.
 */
export default function PostHogAnalytics() {
  if (!POSTHOG_ENABLED) return null;

  return (
    <Script
      id="_next-posthog"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{ __html: buildPostHogBootstrap() }}
    />
  );
}
