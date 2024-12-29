import { JSDOM } from 'jsdom'
import gurmukhiUtils from 'gurmukhi-utils'
import { parse } from 'date-fns'
import { fromZonedTime } from 'date-fns-tz'

const { isGurmukhi, toAscii } = gurmukhiUtils

const fetchLatest = async () => {
  const response = await fetch( 'https://hs.sgpc.net/index.php' )
  if ( !response.ok ) {
    throw new Error( `${response.status} ${response.statusText}` )
  }

  const html = await response.text()
  const { document } = new JSDOM( html ).window

  // Get raw mukhvak text
  const mukhvaakRaw = document.querySelectorAll( 'p' )[ 0 ]
    .textContent
    .replace( /[\r\n\t]/g, '' )
    .replace( /\s+/g, ' ' )

  // Convert to ascii (if needed) and split into lines
  const mukhvaak = ( isGurmukhi( mukhvaakRaw ) ? toAscii( mukhvaakRaw ) : mukhvaakRaw )
    .replace( /]\s?(\d+)\s?]/g, ']$1]' )
    .replace( /](?!\d+|\s?rhwau)/g, ']\n' )
    .split( '\n' )
    .map( line => line.trim() )
    .filter( str => str !== '' )

  // Get page number
  const page = parseInt(
    /\(Page: (\d+)\)/.exec( document.querySelectorAll( 'c1' )[ 4 ].textContent )[ 1 ],
    10,
  )

  // Get date
  const dateRaw = document.querySelectorAll( 'p1' )[ 1 ]
    .textContent
    .trim()

  // Convert to date object
  const date = fromZonedTime(
    parse( dateRaw, 'dd-MM-yyyy', new Date() ),
    'Asia/Kolkata',
  )

  return { mukhvaak, page, date }
}

export default fetchLatest
