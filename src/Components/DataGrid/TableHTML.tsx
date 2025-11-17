
interface TableHTMLProps {
    headers: string[];
    body: (string | number | React.ReactNode)[][];
    tblClass: string;
    condition?: (row: (string | number | React.ReactNode)[]) => boolean;
    conditionDone?: string;
}

const TableHTML = ({ headers, body, tblClass, condition, conditionDone }: TableHTMLProps) => {

    const html = `<table class="table ${tblClass}">
      <thead>
        <tr>
            ${headers.map((header) => `<th>${String(header).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
       ${body.map(
        (row) =>
            `<tr >
                ${row.map((cell) => {
                const isConditionMet = condition ? condition(row) : false;
                return `<td ${isConditionMet ? conditionDone : ''}>${cell}</td>`;
            }).join('')}
            </tr>`
    ).join('')}
      </tbody>
    </table>
  `;
    return html;
};
export default TableHTML;