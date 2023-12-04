import { JSDOM } from 'jsdom'
import gurmukhiUtils from 'gurmukhi-utils'
import { parse } from 'date-fns'
import { zonedTimeToUtc } from 'date-fns-tz'

const { isGurmukhi, toAscii } = gurmukhiUtils

const fetchLatest = async () => {
  const response = await fetch( 'https://old.sgpc.net/hukumnama/sgpconlinehukamnama.asp' )
  if ( !response.ok ) {
    throw new Error( `${response.status} ${response.statusText}` )
  }

  const html = await response.text()
  const { document } = new JSDOM( html ).window

  // Get raw mukhvak text
  const mukhvaakRaw = document.querySelectorAll( 'table' )[ 1 ]
    .textContent
    .replace( /[\r\n\t]/g, '' )
    .replace( /\s+/g, ' ' )

  // Convert to ascii (if needed) and split into lines
  const mukhvaak = ( isGurmukhi( mukhvaakRaw ) ? toAscii( mukhvaakRaw ) : mukhvaakRaw )
    .replace( /](?!\d+|\srhwau)/g, ']\n' )
    .split( '\n' )
    .map( line => line.trim() )
    .filter( str => str !== '' )

  // Get page number
  const page = parseInt(
    /\(Page: (\d+)\)/.exec( document.querySelectorAll( 'table' )[ 5 ].textContent )[ 1 ],
    10,
  )

  // Get date
  const dateRaw = document.querySelector( 'font[face="Georgia, Times New Roman, Times, serif"]' )
    .textContent
    .trim()
    .slice( 1, -1 )
    .replace( 'IST', '' )
    .replace( '.', '' )
    .trim()

  // Convert to date object
  const date = zonedTimeToUtc(
    parse( dateRaw, 'MMMM d, yyyy, EEEE hh:mm a', new Date() ),
    'Asia/Kolkata',
  )

  return { mukhvaak, page, date }
}

export default fetchLatest
