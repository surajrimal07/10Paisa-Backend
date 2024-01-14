// import request from 'supertest';
// import app from '../index';

// describe('API Testing', () => {

//     //Making test for route '/test'
//     it('GET /test | Response with valid text', async () => {


//         const res = await request(app).get('/test');
//         expect(res.statusCode).toBe(200);
//         expect(res.text).toBe('Testing API is running live🥳');
//     });





// });


import request from 'supertest';
import app from '../index';

describe('API Testing', () => {
  let server;

  beforeAll((done) => {
    // Start the server with a delay of 2 seconds (adjust as needed)
    setTimeout(() => {
      try {
        server = app.listen(8000);
        console.log('Server started successfully.');
        done();
      } catch (error) {
        console.error('Error starting the server:', error);
        done(error);
      }
    }, 4000);
  });

  afterAll((done) => {
    try {
      if (server) {
        server.close(() => {
          console.log('Server closed successfully.');
          done();
        });
      } else {
        console.warn('Server is undefined. Unable to close.');
        done();
      }
    } catch (error) {
      console.error('Error closing the server:', error);
      done(error);
    }
  });

  it('GET /test | Response with valid text', async () => {
    const res = await request(app).get('/test');
    expect(res.statusCode).toBe(200);
    expect(res.text).toBe('Testing API is running live🥳');
  }, 20000); // Increase timeout to 10000 ms (10 seconds)
});
