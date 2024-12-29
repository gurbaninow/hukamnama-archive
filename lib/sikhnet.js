import { XMLParser } from 'fast-xml-parser'
import { parse } from 'date-fns'
import { fromZonedTime } from 'date-fns-tz'
import { Shabads } from '@gurbaninow/database'

const fetchLatest = async () => {
  const response = await fetch( 'https://www.sikhnet.com/webapps/gmcws/hukam.php' )
  if ( !response.ok ) {
    throw new Error( `${response.status} ${response.statusText}` )
  }

  const xml = await response.text()
  const { results } = new XMLParser().parse( xml )
  if ( results.error ) {
    throw new Error( results.error )
  }

  return {
    // Convert to Date object
    date: fromZonedTime(
      parse( results.hukam_date, 'yyyy-MM-dd HH:mm:ss', new Date() ),
      'Asia/Kolkata',
    ),
    // Convert to array of ids
    ids: typeof results.sids === 'string' ? results.sids.split( ',' ).map( Number ) : [ results.sids ],
  }
}

const getShabadIds = async () => {
  // Fetch latest mukhvaak from SikhNet
  const { date, ids: sttmIds } = await fetchLatest()

  // Fetch Shabad IDs from database using sttm IDs from SikhNet
  const ids = [ ...await Shabads
    .query()
    .select( 'id' )
    .whereIn( 'sttm_id', sttmIds )
    .orderBy( 'order_id' ) ]
    .map( shabad => shabad.id )

  return { date, ids, sttmIds }
}

export default getShabadIds
