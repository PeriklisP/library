'use strict'

const fs = require('fs')
const path = require('path')

const {google} = require('googleapis')
const datastore = require('@google-cloud/datastore')

const {page1, page2, page3} = require('../fixtures/driveListing')
const {simplePayload, rawPayload, multisectionPayload} = require('../fixtures/testHTML')
const {docResponse, teamResponse} = require('../fixtures/datastoreResponses.json')

const spreadsheetBuf = (() => {
  return {data: fs.readFileSync(path.join(__dirname, '../fixtures/sheetBuffer.buf'))}
})()

exports.init = () => {
  // google drive mocks
  google.auth.getApplicationDefault = () => {
    return {credential: {JWT: {}}}
  }
  google.options = () => {}
  google.drive = () => {
    return {
      files: {
        export: ({mimeType, fileId}) => {
          if (mimeType.includes('spreadsheetml')) return spreadsheetBuf
          if (fileId === 'mulitsection') return multisectionPayload
          return simplePayload
        },
        get: () => rawPayload,
        list: ({pageToken}) => {
          if (pageToken === 'page2') return page2
          if (pageToken === 'page3') return page3
          return page1
        }
      },
      revisions: {
        get: () => {
          return Promise.resolve({ data: {
            kind: 'drive#revision',
            mimeType: 'application/vnd.google-apps.document',
            modifiedTime: '2017-01-01T19:55:07.353Z',
            published: false,
            lastModifyingUser: {
              kind: 'drive#user',
              displayName: 'John Smith',
              photoLink: 'https://foo.com/photo.jpg',
              me: false
            }
          }})
        }
      }
    }
  }

  // google datastore mocks
  datastore.prototype.key = () => {}

  datastore.prototype.runQuery = ({
    kinds
  }) => {
    const kind = kinds[0]
    if (kind === 'LibraryViewDoc') return docResponse
    return teamResponse
  }

  datastore.prototype.get = async () => {
    return [
      {
        viewCount: 5,
        lastViewedAt: '2017-09-08T15:48:55.751Z',
        userId: '10',
        email: 'test.user@nytimes.com'
      }
    ]
  }

  datastore.prototype.upsert = () => Promise.resolve(true)
}
