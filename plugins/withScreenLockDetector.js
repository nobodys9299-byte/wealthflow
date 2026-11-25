const fs = require('fs');
const path = require('path');
const { withDangerousMod, withMainApplication } = require('@expo/config-plugins');

const SCREEN_LOCK_MODULE_KT = `package com.wealthflow.moneytracker

import android.app.Activity
import android.app.Application
import android.app.KeyguardManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.os.PowerManager
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule

object ScreenLockState {
  @Volatile
  var didScreenTurnOff: Boolean = false

  @Volatile
  var isRegistered: Boolean = false

  @Volatile
  var onScreenOffCallback: (() -> Unit)? = null

  private val mainHandler = Handler(Looper.getMainLooper())

  fun isHardwareLockedOrOff(context: Context): Boolean {
    return try {
      val powerManager = context.getSystemService(Context.POWER_SERVICE) as? PowerManager
      val keyguardManager = context.getSystemService(Context.KEYGUARD_SERVICE) as? KeyguardManager
      val isInteractive = powerManager?.isInteractive ?: true
      val isKeyguard = keyguardManager?.isKeyguardLocked ?: false
      val isDeviceLocked = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP_MR1) {
        keyguardManager?.isDeviceLocked ?: false
      } else {
        false
      }
      !isInteractive || isKeyguard || isDeviceLocked
    } catch (_: Exception) {
      false
    }
  }

  private fun markScreenOff() {
    didScreenTurnOff = true
    try {
      onScreenOffCallback?.invoke()
    } catch (_: Exception) {}
  }

  fun ensureRegistered(context: Context) {
    if (isRegistered) return
    synchronized(this) {
      if (isRegistered) return
      try {
        val appCtx = context.applicationContext ?: context
        val receiver = object : BroadcastReceiver() {
          override fun onReceive(ctx: Context?, intent: Intent?) {
            if (intent?.action == Intent.ACTION_SCREEN_OFF) {
              markScreenOff()
            }
          }
        }
        val filter = IntentFilter(Intent.ACTION_SCREEN_OFF)
        if (Build.VERSION.SDK_INT >= 33) {
          try {
            appCtx.registerReceiver(receiver, filter, Context.RECEIVER_EXPORTED)
          } catch (_: Exception) {
            appCtx.registerReceiver(receiver, filter, Context.RECEIVER_NOT_EXPORTED)
          }
        } else {
          appCtx.registerReceiver(receiver, filter)
        }

        if (appCtx is Application) {
          appCtx.registerActivityLifecycleCallbacks(object : Application.ActivityLifecycleCallbacks {
            private fun schedulePowerChecks() {
              val checkRunnable = Runnable {
                if (isHardwareLockedOrOff(appCtx)) {
                  markScreenOff()
                }
              }
              mainHandler.postDelayed(checkRunnable, 150L)
              mainHandler.postDelayed(checkRunnable, 400L)
            }
            override fun onActivityPaused(activity: Activity) { schedulePowerChecks() }
            override fun onActivityStopped(activity: Activity) { schedulePowerChecks() }
            override fun onActivityCreated(activity: Activity, savedInstanceState: Bundle?) {}
            override fun onActivityStarted(activity: Activity) {}
            override fun onActivityResumed(activity: Activity) {}
            override fun onActivitySaveInstanceState(activity: Activity, outState: Bundle) {}
            override fun onActivityDestroyed(activity: Activity) {}
          })
        }
        isRegistered = true
      } catch (_: Exception) {}
    }
  }
}

class ScreenLockModule(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  companion object {
    const val NAME = "ScreenLockDetector"
  }

  override fun getName(): String = NAME

  private fun checkLockedOrOffNow(): Boolean {
    val locked = ScreenLockState.isHardwareLockedOrOff(reactContext)
    if (locked) {
      ScreenLockState.didScreenTurnOff = true
    }
    return locked
  }

  override fun initialize() {
    super.initialize()
    ScreenLockState.ensureRegistered(reactContext)
    ScreenLockState.onScreenOffCallback = {
      try {
        if (reactContext.hasActiveReactInstance()) {
          reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit("WEALTHFLOW_SCREEN_OFF", null)
        }
      } catch (_: Exception) {}
    }
  }

  override fun invalidate() {
    ScreenLockState.onScreenOffCallback = null
    super.invalidate()
  }

  @ReactMethod
  fun isScreenLockedOrOff(promise: Promise) {
    promise.resolve(checkLockedOrOffNow() || ScreenLockState.didScreenTurnOff)
  }

  @ReactMethod
  fun consumeScreenOffFlag(promise: Promise) {
    val wasOff = ScreenLockState.didScreenTurnOff || checkLockedOrOffNow()
    ScreenLockState.didScreenTurnOff = false
    promise.resolve(wasOff)
  }

  @ReactMethod
  fun clearScreenOffFlag() {
    ScreenLockState.didScreenTurnOff = false
  }

  @ReactMethod
  fun addListener(eventName: String) {
    ScreenLockState.ensureRegistered(reactContext)
  }

  @ReactMethod
  fun removeListeners(count: Int) {}
}
`;

const SCREEN_LOCK_PACKAGE_KT = `package com.wealthflow.moneytracker

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

class ScreenLockPackage : ReactPackage {
  @Suppress("DEPRECATION")
  override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> =
    listOf(ScreenLockModule(reactContext))

  override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> =
    emptyList()
}
`;

function withScreenLockDetector(config) {
  config = withDangerousMod(config, [
    'android',
    async (modConfig) => {
      const targetDir = path.join(
        modConfig.modRequest.platformProjectRoot,
        'app',
        'src',
        'main',
        'java',
        'com',
        'wealthflow',
        'moneytracker'
      );
      fs.mkdirSync(targetDir, { recursive: true });
      fs.writeFileSync(path.join(targetDir, 'ScreenLockModule.kt'), SCREEN_LOCK_MODULE_KT, 'utf8');
      fs.writeFileSync(path.join(targetDir, 'ScreenLockPackage.kt'), SCREEN_LOCK_PACKAGE_KT, 'utf8');
      return modConfig;
    },
  ]);

  config = withMainApplication(config, (modConfig) => {
    let contents = modConfig.modResults.contents;
    if (!contents.includes('ScreenLockPackage')) {
      const target = 'PackageList(this).packages.apply {';
      if (contents.includes(target)) {
        contents = contents.replace(target, `${target}\n          add(ScreenLockPackage())`);
      }
    }
    if (!contents.includes('ScreenLockState.ensureRegistered')) {
      const onCreateTarget = 'super.onCreate()';
      if (contents.includes(onCreateTarget)) {
        contents = contents.replace(
          onCreateTarget,
          `${onCreateTarget}\n    ScreenLockState.ensureRegistered(this)`
        );
      }
    }
    modConfig.modResults.contents = contents;
    return modConfig;
  });

  return config;
}

module.exports = withScreenLockDetector;
