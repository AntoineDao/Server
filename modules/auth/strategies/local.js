'use strict'
const passport = require( 'passport' )
const URL = require( 'url' ).URL
const appRoot = require( 'app-root-path' )
const debug = require( 'debug' )
const { createUser, findOrCreateUser, validatePasssword, getUserByEmail } = require( `${appRoot}/modules/core/services/users` )
const { getApp, createAuthorizationCode, createAppTokenFromAccessCode } = require( '../services/apps' )

module.exports = ( app, session, sessionAppId, finalizeAuth ) => {
  const strategy = {
    id: 'local',
    name: 'Local',
    icon: 'TODO',
    color: 'accent',
    url: `/auth/local`
  }

  app.post( '/auth/local/login', session, sessionAppId, async ( req, res, next ) => {
    let valid = await validatePasssword( { email: req.body.email, password: req.body.password } )
    if ( !valid ) {
      return res.status( 401 ).send( { err: true, message: 'Invalid credentials' } )
    }
    let user = await getUserByEmail( { email: req.body.email } )
    req.user = { id: user.id }
    next( )
  }, finalizeAuth )

  app.post( '/auth/local/register', session, sessionAppId, async ( req, res, next ) => {
    try {
      if ( !req.body.password )
        throw new Error( 'Password missing' )
      let userId = await createUser( req.body )
      req.user = { id: userId }
      return next( )
    } catch ( err ) {
      debug( 'speckle:errors' )( err )
      return res.status( 400 ).send( { err: err.message } )
    }
  }, finalizeAuth )

  return strategy
}
