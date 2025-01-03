/* eslint-disable no-console */
import { mkdirSync, writeFileSync, readFileSync } from 'fs'
import appRoot from 'app-root-path'

const writeFile = ( { date: dateStr, ids, sttmIds } ) => {
  const date = dateStr.split( '-' )

  // Create folder if not exists
  const folderPath = `${appRoot}/archive/${date[ 0 ]}/${date[ 1 ]}`
  mkdirSync( folderPath, { recursive: true } )

  // Write file
  // Handle if already exists
  // Error is existing doesn't match fetched.
  const filePath = `${folderPath}/${date[ 2 ]}.json`
  const data = `${JSON.stringify( { sttm2_ids: sttmIds, shabad_ids: ids }, null, 2 )}\n`
  try {
    writeFileSync( filePath, data, { flag: 'wx' } )
  } catch ( error ) {
    if ( error.code === 'EEXIST' ) {
      console.error( error.message )
      console.info( 'Checking if file data matches...' )
      const file = readFileSync( filePath, { encoding: 'utf8', flag: 'r' } )
      if ( file !== data ) {
        throw new Error( 'File - Fetched data does not match existing written file.' )
      }
      console.info( 'Files match!' )
    } else {
      throw error
    }
  }
}

export default writeFile
