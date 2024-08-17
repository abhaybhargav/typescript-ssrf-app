import express from 'express';
import path from 'path';
import { router } from './routes';

const app = express();
const port = 8880;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use('/', router);

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});