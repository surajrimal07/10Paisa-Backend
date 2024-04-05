import request from 'supertest';
import app from '../index.js';

describe('GET /test', () => {
  it('responds with text "Testing API is running live🥳"', (done) => {
    request(app)
      .get('/test')
      .expect(200)
      .expect('Testing API is running live🥳', done);
  });
});

describe('GET /', () => {
  it('responds with text "This API is running live🥳"', (done) => {
    request(app)
      .get('/')
      .expect(200)
      .expect('Content-Type', 'text/html; charset=utf-8')
      .expect(/This API is running live<span class="emoji">🥳<\/span>/, done);
  });
});

describe('GET /api/dashboard', () => {
  it('responds with 200 OK and returns some data', (done) => {
    request(app)
      .get('/api/dashboard')
      .set('Accept', 'application/json')
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        done();
      });
  });
});

describe('GET /api/commodity', () => {
  it('responds with 200 OK', (done) => {
    request(app)
      .get('/api/commodity')
      .expect(200)
      .end(done);
  });
});

describe('GET /api/metal', () => {
  it('responds with 200 OK', (done) => {
    request(app)
      .get('/api/metal')
      .expect(200)
      .end(done);
  });
});

describe('GET /api/sharesansardata', () => {
  it('responds with 200 OK', (done) => {
    request(app)
      .get('/api/sharesansardata')
      .expect(200)
      .end(done);
  });
});

describe('GET /api/dashboard', () => {
  it('responds with 200 OK', (done) => {
    request(app)
      .get('/api/dashboard')
      .expect(200)
      .end(done);
  });
});

describe('GET /api/index', () => {
  it('responds with 200 OK', (done) => {
    request(app)
      .get('/api/index')
      .expect(200)
      .end(done);
  });
});

describe('GET /api/combinedindex', () => {
  it('responds with 200 OK', (done) => {
    request(app)
      .get('/api/combinedindex')
      .expect(200)
      .end(done);
  });
});

describe('GET /api/allusers', () => {
  it('responds with 200 OK', (done) => {
    request(app)
      .get('/api/allusers')
      .expect(200)
      .end(done);
  });
});

describe('GET /api/allportfolios', () => {
  it('responds with 200 OK', (done) => {
    request(app)
      .get('/api/allportfolios')
      .expect(200)
      .end(done);
  });
});

describe('GET /api/nrbbankdata', () => {
  it('responds with 200 OK', (done) => {
    request(app)
      .get('/api/nrbbankdata')
      .expect(200)
      .end(done);
  });
});

describe('GET /api/nrbbankingdataAll', () => {
  it('responds with 200 OK', (done) => {
    request(app)
      .get('/api/nrbbankingdataAll')
      .expect(200)
      .end(done);
  });
});

describe('GET /api/nrbforexdata', () => {
  it('responds with 200 OK', (done) => {
    request(app)
      .get('/api/nrbforexdata')
      .expect(200)
      .end(done);
  });
});

describe('GET /api/combinednrbdata', () => {
  it('responds with 200 OK', (done) => {
    request(app)
      .get('/api/combinednrbdata')
      .expect(200)
      .end(done);
  });
});

describe('GET /api/worldmarketdata', () => {
  it('responds with 200 OK', (done) => {
    request(app)
      .get('/api/worldmarketdata')
      .expect(200)
      .end(done);
  });
});
describe('Forget Password Function', () => {
  it('should return an error if the email is not found', (done) => {
    const randomEmail = 'nonexistent@example.com';

    request(app)
      .post('/api/forget')
      .send({ email: randomEmail })
      .expect(404)
      .expect('Content-Type', /json/)
      .end(done);
    })});


    describe('Get Watchlists by User Email Function', () => {
      it('should return an error if no watchlists found for the user', (done) => {
        const randomEmail = 'nonexistent@example.com';

        request(app)
          .post('/api/getwatchlist')
          .send({ email: randomEmail })
          .expect(404)
          .expect('Content-Type', /json/)
          .end(done);
      });
    });


describe('Login Function', () => {
  it('should return an error for invalid credentials', (done) => {
    const randomEmail = 'random@example.com';
    const randomPassword = 'randompassword123';

    request(app)
      .post('/api/login')
      .send({ email: randomEmail, password: randomPassword })
      .expect(401)
      .end(done);
    },10000);
  })