const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../index');

chai.should();
chai.use(chaiHttp);

describe('Tasks API' , () => {
    it('Should GET /', (done) => {
        chai.request(server)
        .get('/')
        .end((err, response) => {
            response.should.have.status(200);
            done();
        })
    });

    let endpoints = [
        "orders-count",
        "/orders-per-producer/antiqua",
        "/vaccines-count",
        "/orders-arrived-on-date/1626552000000",
        "/expired-bottles/1626552000000",
        "/vaccines-will-expire/1626552000000",
        "/vaccines-used/1626552000000",
        "/vaccines-used-by-date/1626552000000",
        "/expired-before-usage/1626552000000"
    ];
    
    for(endpoint of endpoints) {
        it('Should GET '+endpoint, (done) => {
            chai.request(server)
            .get(endpoint)
            .end((err, response) => {
                response.should.have.status(200);
                done();
            })
        });
    }
    
});