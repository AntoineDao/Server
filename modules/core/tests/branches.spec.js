/* istanbul ignore file */
const chai = require( 'chai' )
const chaiHttp = require( 'chai-http' )
const assert = require( 'assert' )

const appRoot = require( 'app-root-path' )
const { init } = require( `${appRoot}/app` )
const knex = require( `${appRoot}/db/knex` )

const expect = chai.expect
chai.use( chaiHttp )


const { createUser, createPersonalAccessToken, revokeToken, revokeTokenById, validateToken, getUserTokens } = require( '../services/users' )
const { createStream, getStream, updateStream, deleteStream, getStreamsUser, grantPermissionsStream, revokePermissionsStream } = require( '../services/streams' )
const { createObject, createObjects, getObject, getObjects } = require( '../services/objects' )
const {
  createBranch,
  updateBranch,
  getBranchById,
  getBranchesByStreamId,
} = require( '../services/branches' )

describe( 'Branches', ( ) => {
  let user = {
    username: 'dim4242',
    name: 'Dimitrie Stefanescu',
    email: 'didimitrie4342@gmail.com',
    password: 'sn3aky-1337-b1m'
  }

  let stream = {
    name: 'Test Stream References',
    description: 'Whatever goes in here usually...'
  }

  let commit1 = { description: 'First Commit' }

  let commit2 = { description: 'Second Commit' }

  let branch = {
    name: '🧨 super branch 🧨',
    description: 'a test branch'
  }

  before( async ( ) => {
    await knex.migrate.latest( )

    user.id = await createUser( user )
    stream.id = await createStream( stream, user.id )

    commit1.hash = await createCommit( stream.id, user.id, commit1 )
    commit2.parents = [ commit1.hash ]
    commit2.hash = await createCommit( stream.id, user.id, commit2 )
    
  } )

  after( async ( ) => {
    await knex.migrate.rollback( )
  } )

  it( 'Should create a branch', async ( ) => {
    branch.commits = [ commit1.hash, commit1.hash ]
    branch.id = await createBranch( branch, stream.id, user.id )
    expect( branch.id ).to.be.not.null
  } )

  it( 'Should not allow dupe branches', async ( ) => {
    try {
      let dupeBranch = { ...branch }
      await createBranch( dupeBranch, stream.id, user.id )
      assert.fail( 'Duplicate branches should not be allowed.' )
    } catch ( err ) {
      // Pass
    }
  } )

  it( 'Should get a branch', async ( ) => {
    let myBranch = await getBranchById( branch.id )

    delete myBranch.createdAt // delete minor stuffs
    delete myBranch.updatedAt
    delete myBranch.commitId
    delete myBranch.commits

    expect( myBranch ).to.deep.equal( branch )
  } )

  it( 'Should update a branch', async ( ) => {
    branch.commits = [ commit1.hash ]
    await updateBranch( branch )

    let myBranchAfterFirstUpdate = await getBranchById( branch.id )
    expect( myBranchAfterFirstUpdate.commits ).to.have.lengthOf( 1 )

    let newCommit = { test: 'test', best: true }
    newCommit.hash = await createCommit( stream.id, user.id, newCommit )

    branch.commits = [ commit2.hash, newCommit.hash, commit1.hash ]
    branch.name = 'A Different Name'
    await updateBranch( branch )

    let myBranchAfterSecondUpdate = await getBranchById( branch.id )
    expect( myBranchAfterSecondUpdate.commits ).to.have.lengthOf( 3, 'Branch commits should not be removed, only appended.' )
    expect( myBranchAfterSecondUpdate.name ).to.equal( 'A Different Name' )
  } )

  it( 'Should get all stream references', async ( ) => {
    let references = await getStreamReferences( stream.id )
    let tags = references.filter( r => r.type === 'tag' )
    let branches = references.filter( r => r.type === 'branch' )

    expect( tags ).to.have.lengthOf( 2 )
    expect( branches ).to.have.lengthOf( 1 )
  } )

  it( 'Should get all stream tags', async ( ) => {
    await createTag( { name: 'v3.0.0', commitId: commit2.hash }, stream.id, user.id )
    await createTag( { name: 'v4.0.0', commitId: commit1.hash }, stream.id, user.id )
    let tags = await getTagsByStreamId( stream.id )
    expect( tags ).to.have.lengthOf( 4 )
  } )

  it( 'Should get all stream branches', async ( ) => {
    await createBranch( { name: 'master' }, stream.id, user.id ) // an actually useful branch name
    await createBranch( { name: 'dim-dev' }, stream.id, user.id )
    let branches = await getBranchesByStreamId( stream.id )
    expect( branches ).to.have.lengthOf( 3 )
  } )

} )