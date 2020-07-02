import './index.module.styl'
import React from 'react'
import { Context } from '../'
import Small from '../helpers/small'

import Header from './header'
import Content from './content'
import Footer from './footer'

export default class SplitViewMain extends React.Component {
    static contextType = Context

    ref = React.createRef()
    
    render() {
        const { children, className='', ...other } = this.props

        return (
            <Small 
                ref={this.ref}
                className={'svMain '+className}
                minWidth={600}
                {...other}>
                {children}
            </Small>
        )
    }
}

export {
    Header,
    Content,
    Footer,
}