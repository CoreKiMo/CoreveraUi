import React from 'react';
import { CheckBox, Popover } from "devextreme-react";
import { t } from "i18next";

import { Pin, PinOff, Settings } from "lucide-react";

export default function CustomColumnChooser({
  id = "",
  openCustomChooser,
  columnsState,
  toggleVisibility,
  toggleFixed,
  showCustomChooser,
}: {
  id: string | null;
  showCustomChooser: boolean;
  openCustomChooser: () => void;
  toggleVisibility: (i: string | undefined, value: boolean) => void;
  toggleFixed: (
    i: string | undefined,
    value?: string | undefined | null
  ) => void;
  columnsState: {
    visible?: boolean;
    fixed?: boolean;
    dataField?: string;
    caption?: string;
  }[];
}) {
  return (
    <div>
      <Popover
        showEvent="click"
        target={`#custom-column-chooser-${id}`}
        position="bottom"
        visible={showCustomChooser}
        onHiding={openCustomChooser}
      >
        <div
          className={`
            bg-white text-[#21293b] border-[#e5e8f0] rounded-md
            dark:bg-[#1c1d21] dark:text-white dark:border-[#525151]
          `}
        >
          <p className="mb-2">{t("hideAndShowColumns")}</p>
          <div className="border-t pt-2 flex flex-col gap-2 border-[#e5e8f0] dark:border-[#525151]">
            {columnsState && columnsState.length > 0 ? (
              columnsState.map((i) => (
                <section
                  key={i.dataField || i.caption}
                  className="flex gap-8 justify-between"
                >
                  <section className="flex items-center gap-2">
                    <CheckBox
                      value={
                        !Object.prototype.hasOwnProperty.call(i, "visible") ||
                        i.visible
                      }
                      onValueChanged={(e) =>
                        toggleVisibility(i.dataField, e?.value ?? false)
                      }
                    />
                    <p className="text-gray-900 dark:text-gray-200">{i.caption}</p>
                  </section>

                  <section>
                    {i.fixed ? (
                      <button
                        onClick={() => toggleFixed(i.dataField)}
                        className="cursor-pointer transition-colors rounded p-1 hover:bg-[#e5edff] dark:hover:bg-[#23242a]"
                        title={t("unpinColumn")}
                      >
                        <PinOff
                          className="rotate-45"
                          size={12}
                          color="currentColor"
                        />
                      </button>
                    ) : (
                      <section
                        style={{ direction: "rtl" }}
                        className="flex items-center gap-3"
                      >
                        <button
                          onClick={() => toggleFixed(i.dataField, "right")}
                          className="cursor-pointer transition-colors rounded p-1 hover:bg-[#e5edff] dark:hover:bg-[#23242a]"
                          title={t("pinRight")}
                        >
                          <Pin
                            size={12}
                            className="rotate-270"
                            color="currentColor"
                          />
                        </button>
                        <button
                          onClick={() => toggleFixed(i.dataField, "left")}
                          className="cursor-pointer transition-colors rounded p-1 hover:bg-[#e5edff] dark:hover:bg-[#23242a]"
                          title={t("pinLeft")}
                        >
                          <Pin
                            size={12}
                            className="rotate-90"
                            color="currentColor"
                          />
                        </button>
                      </section>
                    )}
                  </section>
                </section>
              ))
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                {t("noColumnsAvailable")}
              </p>
            )}
          </div>
        </div>
      </Popover>
      <button
        className="rounded-full dark:text-white h-[30px] w-[30px] flex items-center justify-center cursor-pointer transition-colors
          hover:bg-[#dbeafe]/50 dark:hover:bg-[#1e293b]/50"
        onClick={openCustomChooser}
        id={`custom-column-chooser-${id}`}
        style={{
          backgroundColor: "transparent",
        }}
      >
        <Settings size={18} />
      </button>
    </div>
  );
}