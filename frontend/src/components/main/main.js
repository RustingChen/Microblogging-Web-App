import React from 'react'

import Headline from './headline'
import Following from './following'
import ArticlesView from '../article/articlesView'

const Main = () => (
    <div className="row">
        <div className="row">&nbsp;</div>
        <div className="row">&nbsp;</div>
        <div className="row">&nbsp;</div>

        <div className="col-md-3 col-xs-3" id="contain-setting">
            <Headline/>
            <Following/>
        </div>
        <div className="col-md-9 col-xs-9">
        <ArticlesView/>
        </div>
    </div>
)

export default Main



/** WEBPACK FOOTER **
 ** ./src/components/main/main.js
 **/
