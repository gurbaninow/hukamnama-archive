/* eslint-disable no-console */
import { knex } from '@gurbaninow/database'
import { toZonedTime } from 'date-fns-tz'
import getSikhnet from './lib/sikhnet.js'
import getSGPC from './lib/sgpc.js'
import writeFile from './lib/writeFile.js'

let hukam = false
const today = toZonedTime( new Date(), 'Asia/Kolkata' ).toISOString().split( 'T' )[ 0 ]

console.info( 'Fetching Hukamnama from Sikhnet...' )
try {
  const sikhnet = await getSikhnet()
  const date = toZonedTime( sikhnet.date, 'Asia/Kolkata' ).toISOString().split( 'T' )[ 0 ]
  if ( date !== today ) {
    throw new Error( 'Sikhnet - Hukamnama not available for this day.' )
  }
  hukam = {
    ...sikhnet,
    date,
  }
} catch ( error ) {
  console.error( error )
}

// If Hukamnama is not available from SikhNet, try SGPC
if ( !hukam ) {
  console.info( 'Fetching Hukamnama from SGPC (fallback)...' )
  try {
    const sgpc = await getSGPC()
    const date = toZonedTime( sgpc.date, 'Asia/Kolkata' ).toISOString().split( 'T' )[ 0 ]
    if ( date !== today ) {
      throw new Error( 'SGPC - Hukamnama not available for this day.' )
    }
    hukam = {
      ...sgpc,
      date,
    }
  } catch ( error ) {
    console.error( error )
  }
}

// Throw error if Hukamnama is not available
if ( !hukam ) {
  throw new Error( 'Failed to fetch hukamnama for today.' )
}

// Write Hukamnama to file
console.info( 'Writing Hukamnama to file...' )
writeFile( hukam )

// Close database connection
console.info( 'Exiting...' )
knex.destroy()
