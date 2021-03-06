require("dotenv").config();
const {
  clampValue,
  parseBoolean,
  parseArray,
  CONSTANTS,
} = require("../src/common/utils");
const ResponseType = require("../src/common/responseType");
const fetchTopLanguages = require("../src/fetchers/top-languages-fetcher");
const renderTopLanguages = require("../src/cards/top-languages-card");
const blacklist = require("../src/common/blacklist");
const { isLocaleAvailable } = require("../src/translations");

module.exports = async (req, res) => {
  const {
    username,
    hide,
    hide_title,
    hide_border,
    card_width,
    title_color,
    text_color,
    bg_color,
    theme,
    cache_seconds,
    layout,
    langs_count,
    exclude_repo,
    custom_title,
    locale,
    response_type,
    callback,
  } = req.query;
  let topLangs;
  const { contentType, error, render } = ResponseType({
    response_type,
    callback,
    renderCard: renderTopLanguages,
  });

  res.setHeader("Content-Type", contentType);

  if (blacklist.includes(username)) {
    return res.send(error("Something went wrong"));
  }

  if (locale && !isLocaleAvailable(locale)) {
    return res.send(error("Something went wrong", "Language not found"));
  }

  try {
    topLangs = await fetchTopLanguages(
      username,
      langs_count,
      parseArray(exclude_repo),
    );

    const cacheSeconds = clampValue(
      parseInt(cache_seconds || CONSTANTS.TWO_HOURS, 10),
      CONSTANTS.TWO_HOURS,
      CONSTANTS.ONE_DAY,
    );

    res.setHeader("Cache-Control", `public, max-age=${cacheSeconds}`);

    return res.send(
      render(topLangs, {
        custom_title,
        hide_title: parseBoolean(hide_title),
        hide_border: parseBoolean(hide_border),
        card_width: parseInt(card_width, 10),
        hide: parseArray(hide),
        title_color,
        text_color,
        bg_color,
        theme,
        layout,
        locale: locale ? locale.toLowerCase() : null,
      }),
    );
  } catch (err) {
    return res.send(error(err.message, err.secondaryMessage));
  }
};
