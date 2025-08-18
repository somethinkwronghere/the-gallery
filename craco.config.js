/*
  Exclude problematic packages from source-map-loader to silence dev warnings
  like: Failed to parse source map from @mediapipe/tasks-vision
*/

/**
 * Recursively walk webpack rules to find any usage of source-map-loader
 * and add an exclusion for @mediapipe/tasks-vision.
 */
function excludeMediapipeFromSourceMapLoader(rules) {
  if (!Array.isArray(rules)) return;
  for (const rule of rules) {
    if (rule.use) {
      const uses = Array.isArray(rule.use) ? rule.use : [rule.use];
      const hasSourceMapLoader = uses.some(
        (u) => u && u.loader && u.loader.includes('source-map-loader')
      );
      if (hasSourceMapLoader) {
        const exclude = rule.exclude || [];
        const exclusion = /@mediapipe[\\\/]tasks-vision/;
        if (Array.isArray(exclude)) {
          rule.exclude = [...exclude, exclusion];
        } else if (exclude) {
          rule.exclude = [exclude, exclusion];
        } else {
          rule.exclude = [exclusion];
        }
      }
    }
    if (rule.oneOf) excludeMediapipeFromSourceMapLoader(rule.oneOf);
    if (rule.rules) excludeMediapipeFromSourceMapLoader(rule.rules);
  }
}

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      if (webpackConfig && webpackConfig.module && webpackConfig.module.rules) {
        excludeMediapipeFromSourceMapLoader(webpackConfig.module.rules);
      }
      // Silence noisy third-party source map warnings
      webpackConfig.ignoreWarnings = (
        webpackConfig.ignoreWarnings || []
      ).concat([
        /Failed to parse source map.*@mediapipe/,
      ]);
      return webpackConfig;
    },
  },
};


