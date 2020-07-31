import s from './item.module.styl'
import React from 'react'

function ItemInner({ as='div', className='', active, color, focusable, style={}, forwardedRef, ...etc }) {
    const Component = as
    return (
        <Component 
            {...etc}
            ref={forwardedRef}
            className={`${className} ${s.item} ${active && s.active} ${focusable && s.focusable}`}
            style={{'--accent-color': color, ...style}} />
    )
}

export const Item = React.forwardRef((props, ref) => {
    return <ItemInner {...props} forwardedRef={ref} />
})

let _cachedHeight = 0
export const getItemHeight = ()=>{
    if (_cachedHeight)
        return _cachedHeight

    const cssVariable = getComputedStyle(document.documentElement).getPropertyValue('--list-item-height')
    _cachedHeight = parseInt(cssVariable)
    
    //rem parse
    if (cssVariable.includes('rem'))
        _cachedHeight = _cachedHeight * parseFloat(getComputedStyle(document.documentElement).fontSize)

    return _cachedHeight
}

export function ItemIcon({ className='', ...etc }) {
    return (
        <div {...etc} className={s.icon+' '+className} />
    )
}

export function ItemTitle({ className='', ...etc }) {
    return (
        <div {...etc} className={s.title+' '+className} />
    )
}

export function ItemInfo({ className='', ...etc }) {
    return (
        <div {...etc} className={s.info+' '+className} />
    )
}

export function ItemActions({ className='', ...etc }) {
    return (
        <div {...etc} className={s.actions+' '+className} />
    )
}