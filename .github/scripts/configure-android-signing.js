const fs = require('fs');
const path = require('path');

/**
 * Configures Android release signing in `android/app/build.gradle`
 * to use `android/app/upload.keystore` and environment variables from GitHub Secrets.
 */
function patchBuildGradle(gradleContent) {
  const signingBlockRegex = /(signingConfigs\s*\{\s*debug\s*\{[\s\S]*?\}\s*)(\})/;
  if (!signingBlockRegex.test(gradleContent)) {
    throw new Error('Could not locate signingConfigs { debug { ... } } in android/app/build.gradle');
  }

  let updated = gradleContent.replace(
    signingBlockRegex,
    `$1    release {\n` +
      `            storeFile file('upload.keystore')\n` +
      `            storePassword System.getenv('ANDROID_KEYSTORE_PASSWORD')\n` +
      `            keyAlias System.getenv('ANDROID_KEY_ALIAS')\n` +
      `            keyPassword System.getenv('ANDROID_KEY_PASSWORD')\n` +
      `        }\n` +
      `    $2`
  );

  const releaseBuildTypeRegex = /(buildTypes\s*\{[\s\S]*?release\s*\{[\s\S]*?)(signingConfig\s+signingConfigs\.debug)/;
  if (!releaseBuildTypeRegex.test(updated)) {
    throw new Error('Could not locate release { signingConfig signingConfigs.debug } in android/app/build.gradle');
  }

  updated = updated.replace(releaseBuildTypeRegex, '$1signingConfig signingConfigs.release');
  return updated;
}

if (require.main === module) {
  const projectRoot = path.resolve(__dirname, '../..');
  const buildGradlePath = path.join(projectRoot, 'android', 'app', 'build.gradle');
  const keystorePath = path.join(projectRoot, 'android', 'app', 'upload.keystore');

  if (!fs.existsSync(keystorePath)) {
    console.error(`Missing decoded keystore file at: ${keystorePath}`);
    process.exit(1);
  }
  if (!fs.existsSync(buildGradlePath)) {
    console.error(`Missing Gradle file at: ${buildGradlePath}`);
    process.exit(1);
  }

  const original = fs.readFileSync(buildGradlePath, 'utf8');
  const patched = patchBuildGradle(original);
  fs.writeFileSync(buildGradlePath, patched, 'utf8');
  console.log('Successfully configured Android release signing in android/app/build.gradle');
}

module.exports = { patchBuildGradle };
