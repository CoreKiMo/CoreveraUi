import { GetCurrentLanguageFromLocalStorage } from "../../Services/GetDataFromLocalStorage";
import { useState } from "react";

type ServerPaginProps = {
  allowedPageSizes: number[];
  pageSize: number;
  totalPages: number;
  handelServerPagginChange: (i: number, x: number) => void;
};

export default function ServerPagin({
  allowedPageSizes,
  pageSize: defaultPageSize,
  totalPages,
  handelServerPagginChange,
}: ServerPaginProps) {
  const lang = GetCurrentLanguageFromLocalStorage();

  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [pageNumber, setPageNumber] = useState(1);

  const handelPageSizeChange = (size: number) => {
    if (size !== pageSize) {
      setPageSize(size);
      handelServerPagginChange(1, size);
    }
  };
  const handelPageNumberChange = (number: number) => {
    if (pageNumber !== number) {
      setPageNumber(number);
      handelServerPagginChange(number, pageSize);
    }
  };

  return (
    <div className=" flex items-center justify-between gap-3 px-2 my-4 ">
      <div className=" flex items-center gap-[2px]  ">
        {allowedPageSizes.map((val) => (
          <button
            onClick={() => handelPageSizeChange(val)}
            key={val}
            className={`${
              val === pageSize
                ? "bg-[var(--custom-dx-accent-bg-color)] text-white"
                : "hover:bg-gray-400"
            } cursor-pointer rounded-md px-[12px] py-[8px]`}
          >
            {val}
          </button>
        ))}
      </div>
      <div className=" flex items-center gap-[2px]  ">
        <button
          disabled={pageNumber === 1}
          onClick={() => handelPageNumberChange(pageNumber - 1)}
          className={`disabled:opacity-55 disabled:cursor-not-allowed bg-[var(--custom-dx-background-gray)]
           cursor-pointer rounded-md px-[12px] py-[8px]`}
        >
          <i className="fa-solid fa-chevron-right"></i>
        </button>
        {[...Array(totalPages)].map((_, idx) => {
          const page = idx + 1;

          // If 6 or fewer pages, show all buttons
          if (totalPages <= 6) {
            return (
              <button
                onClick={() => handelPageNumberChange(page)}
                key={page}
                className={`${
                  page === pageNumber
                    ? "bg-[var(--custom-dx-accent-bg-color)] text-white"
                    : "hover:bg-gray-400"
                } cursor-pointer rounded-md px-[12px] py-[8px]`}
              >
                {page}
              </button>
            );
          }

          // If more than 6 pages, show first, last, current +/- 1, with ellipsis where needed
          // Show: [1] ... [current-1] [current] [current+1] ... [last]
          // Always show "1" and "totalPages".
          if (
            page === 1 ||
            page === totalPages ||
            (page >= pageNumber - 1 && page <= pageNumber + 1)
          ) {
            return (
              <button
                onClick={() => handelPageNumberChange(page)}
                key={page}
                className={`${
                  page === pageNumber
                    ? "bg-[var(--custom-dx-accent-bg-color)] text-white"
                    : "hover:bg-gray-400"
                } cursor-pointer rounded-md px-[12px] py-[8px]`}
              >
                {page}
              </button>
            );
          }
          // Insert first ellipsis after first item if needed
          if (page === 2 && pageNumber > 3) {
            return (
              <span key="start-ellipsis" className="px-2">
                ...
              </span>
            );
          }
          // Insert second ellipsis before last item if needed
          if (page === totalPages - 1 && pageNumber < totalPages - 2) {
            return (
              <span key="end-ellipsis" className="px-2">
                ...
              </span>
            );
          }
          return null;
        })}
        <button
          disabled={pageNumber === totalPages}
          onClick={() => handelPageNumberChange(pageNumber + 1)}
          className={`disabled:opacity-55  disabled:cursor-not-allowed bg-[var(--custom-dx-background-gray)]
           cursor-pointer rounded-md px-[12px] py-[8px]`}
        >
          <i className="fa-solid fa-chevron-left"></i>
        </button>

        <p>
          {lang === "ar"
            ? `الصفحة ${pageNumber} من ${totalPages}`
            : `Page ${pageNumber} of ${totalPages}`}
        </p>
      </div>
    </div>
  );
}