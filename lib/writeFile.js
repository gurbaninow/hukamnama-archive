import { mkdirSync, writeFileSync } from 'fs'

const writeFile = ( { date: dateStr, ids, sttmIds } ) => {
  const date = dateStr.split( '-' )

  // Create folder if not exists
  mkdirSync( `./archive/${date[ 0 ]}/${date[ 1 ]}`, { recursive: true } )

  // Write file
  // Error if already exists
  writeFileSync(
    `./archive/${date[ 0 ]}/${date[ 1 ]}/${date[ 2 ]}.json`,
    `${JSON.stringify( { sttm2_ids: sttmIds, shabad_ids: ids }, null, 2 )}\n`,
    { flag: 'wx' },
  )
}

export default writeFile
