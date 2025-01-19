import { JSDOM } from 'jsdom'
import gurmukhiUtils from 'gurmukhi-utils'
import { parse } from 'date-fns'
import { fromZonedTime } from 'date-fns-tz'
import { Lines } from '@gurbaninow/database'

const {
  isGurmukhi,
  toAscii,
  firstLetters,
  stripEndings,
  toUnicode,
} = gurmukhiUtils

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
  const extractPageTags = Array.from( document.querySelectorAll( 'c1' ) )
    .map( obj => obj.textContent )
    .join()
  const page = parseInt(
    /\((Ang|Page): (\d+)\)/.exec( extractPageTags )[ 2 ],
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

const isConsecutive = array => (
  array.every( ( { orderId }, i ) => i === 0 || +orderId === +array[ i - 1 ].orderId + 1 )
)

const getShabadIds = async () => {
  // Fetch latest mukhvaak from SGPC
  const { mukhvaak, page, date } = await fetchLatest()

  // For each line, get first letters
  const mukhvaakFirstLetter = mukhvaak.map( text => [
    toUnicode,
    stripEndings,
    firstLetters,
    toAscii,
  ].reduce( ( text, fn ) => fn( text ), text ) )
  // Remove strings with length <= 3
    .filter( string => string.length > 3 )

  // Build query
  // Only search SGGS and limit to page and page+1
  const searchData = Lines.query()
    .join( 'line_content', 'line_content.line_id', 'lines.id' )
    .join( 'shabads', 'shabads.id', 'lines.shabad_id' )
    .whereIn( 'lines.source_page', [ page, page + 1 ] )
    .andWhere( 'shabads.composition_id', 1 )

  // Run a search for every line
  let search = await Promise.all(
    mukhvaakFirstLetter.toReversed().map(
      // eslint-disable-next-line no-return-await
      async letters => await searchData.clone().genericSearch(
        letters,
        'line_content.first_letters',
        true,
        false,
        false,
      ),
    ),
  )
  // Get first result of each search, ignore undefined and null
  search = search.map( lines => lines[ 0 ] )
    .filter( line => line !== undefined && line !== null )
  // Exract shabadId, sttmId, and orderId
  search = search.map( ( { shabadId, sttmId, orderId } ) => ( { shabadId, sttmId, orderId } ) )
  // Remove duplicates
  search = search.filter( ( o, index, arr ) => arr.findIndex(
    item => JSON.stringify( item ) === JSON.stringify( o ),
  ) === index )
  // Sort using orderId
  search.sort( ( a, b ) => a.orderId - b.orderId )
  // Check if orderIds are consecutive
  // In multi-shabad hukamnamas (e.g. from Vaars),
  // saloks + pauri should be consecutive
  if ( search.length > 1 && !isConsecutive( search ) ) {
    throw RangeError( 'SGPC - Shabads found not consecutive.' )
  }

  return {
    date,
    ids: search.map( line => line.shabadId ),
    sttmIds: search.map( line => line.sttmId ),
  }
}

export default getShabadIds
