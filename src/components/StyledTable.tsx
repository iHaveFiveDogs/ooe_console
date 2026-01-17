import React from 'react'
import { Table as AntTable } from 'antd'
import type { TableProps } from 'antd'
import tableStyles from './Table.module.css'

// Small wrapper around Ant Design Table that automatically merges project table styles
export default function StyledTable<RecordType = any>(props: TableProps<RecordType>): JSX.Element {
    const { className, rowClassName, ...rest } = props

    const mergedClassName = [tableStyles.table, className].filter(Boolean).join(' ')

    const mergedRowClassName = typeof rowClassName === 'function'
        ? (record: RecordType, index?: number) => {
            const prev = (rowClassName as any)(record, index) || ''
            return [prev, tableStyles.row].filter(Boolean).join(' ')
        }
        : [rowClassName, tableStyles.row].filter(Boolean).join(' ')

    return (
        <AntTable<RecordType>
            {...(rest as TableProps<RecordType>)}
            className={mergedClassName}
            rowClassName={mergedRowClassName as any}
        />
    )
}
