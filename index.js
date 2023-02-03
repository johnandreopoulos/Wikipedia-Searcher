const express = require('express');
const app = express();
const path = require('path');
const { fetch } = require('undici');

app.use(express.json());
app.set('view engine', 'ejs');
app.set('views', path.resolve(__dirname, 'views'));

const assetsPath = path.resolve(__dirname, 'views/partials/assets');
app.use('/assets', express.static(assetsPath));

app.get('/', (_, res) => res.render('index'));

app.get('/search', async (req, res) => {
  const { search } = req.query;
  if (!search) {
    return res.status(400).json({ error: 'A search query must be provided.' });
  }

  try {
    const wikipedia = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${search}`)
      .then((response) => response.json())
      .then(({ title, extract, thumbnail }) => ({
        title,
        extract,
        thumbnail: thumbnail ? thumbnail.source : null,
      }));

    const websites = await fetch(`https://api.duckduckgo.com/?q=${search}&format=json`)
      .then((response) => response.json())
      .then(({ RelatedTopics }) =>
        RelatedTopics
          .filter(({ FirstURL, Text }) => FirstURL && Text)
          .map(({ FirstURL, Text }) => ({ url: FirstURL, title: Text }))
      );

    res.json({ wikipedia, websites });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

app.listen(3000, () => console.log('Server is running on port 3000'));