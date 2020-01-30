'use strict'

module.exports = function (fastify, opts, next) {
  fastify.get('/', async function (request, reply) {
    const result = await fastify.balances()

    reply.view('/views/balances.art', result)
  })

  next()
}


// If you prefer async/await, use the following
//
// module.exports = async function (fastify, opts) {
//   fastify.get('/', async function (request, reply) {
//     return { root: true }
//   })
// }
