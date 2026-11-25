const fs = require('fs');
const path = require('path');
const { withDangerousMod, withMainApplication } = require('@expo/config-plugins');

const SCREEN_LOCK_MODULE_KT = `package com.wealthflow.moneytracker

import android.app.KeyguardManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Build
import android.os.PowerManager
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule

class ScreenLockModule(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  companion object {
    const val NAME = "ScreenLockDetector"
  }

  private var screenOffReceiver: BroadcastReceiver? = null

  override fun getName(): String = NAME

  override fun initialize() {
    super.initialize()
    try {
      if (screenOffReceiver == null) {
        val receiver = object : BroadcastReceiver() {
          override fun onReceive(context: Context?, intent: Intent?) {
            if (intent?.action == Intent.ACTION_SCREEN_OFF) {
              try {
                if (reactContext.hasActiveReactInstance()) {
                  reactContext
                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                    .emit("WEALTHFLOW_SCREEN_OFF", null)
                }
              } catch (_: Exception) {}
            }
          }
        }
        val filter = IntentFilter(Intent.ACTION_SCREEN_OFF)
        if (Build.VERSION.SDK_INT >= 33) {
          reactContext.registerReceiver(receiver, filter, Context.RECEIVER_NOT_EXPORTED)
        } else {
          reactContext.registerReceiver(receiver, filter)
        }
        screenOffReceiver = receiver
      }
    } catch (_: Exception) {}
  }

  override fun invalidate() {
    try {
      screenOffReceiver?.let {
        reactContext.unregisterReceiver(it)
      }
      screenOffReceiver = null
    } catch (_: Exception) {}
    super.invalidate()
  }

  @ReactMethod
  fun isScreenLockedOrOff(promise: Promise) {
    try {
      val powerManager = reactContext.getSystemService(Context.POWER_SERVICE) as? PowerManager
      val keyguardManager = reactContext.getSystemService(Context.KEYGUARD_SERVICE) as? KeyguardManager
      val isInteractive = powerManager?.isInteractive ?: true
      val isKeyguard = keyguardManager?.isKeyguardLocked ?: false
      val isDeviceLocked = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP_MR1) {
        keyguardManager?.isDeviceLocked ?: false
      } else {
        false
      }
      promise.resolve(!isInteractive || isKeyguard || isDeviceLocked)
    } catch (_: Exception) {
      promise.resolve(false)
    }
  }

  @ReactMethod
  fun addListener(eventName: String) {}

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
    modConfig.modResults.contents = contents;
    return modConfig;
  });

  return config;
}

module.exports = withScreenLockDetector;
