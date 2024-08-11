import React, { useState, useContext } from 'react';
import HomeContext from '@/pages/api/home/home.context';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const CheckboxDialog: React.FC<Props> = ({
  isOpen,
  onClose,
}) => {
  const {
    state: { 
        isRagChecked,
        ragOptionList = [],
        selectedOptions =[],
     },
    dispatch,
  } = useContext(HomeContext);

  const handleCheckboxChange = (value: string) => {
    const newSelectedOptions = selectedOptions.includes(value)
      ? selectedOptions.filter(option => option !== value)
      : [...selectedOptions, value];
    // onSelectionChange(newSelectedOptions);
    dispatch({ field: 'selectedOptions', value: newSelectedOptions });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-[#343541] rounded-lg p-6 w-80 relative">
        <h2 className="text-lg font-bold mb-4 text-neutral-900 dark:text-white">RAGのタグを選択</h2>
        <div className="flex flex-col">
          {ragOptionList.map(option => (
            <label key={option} className="flex items-center mb-2">
              <input
                type="checkbox"
                checked={selectedOptions.includes(option)}
                onChange={() => handleCheckboxChange(option)}
                className="mr-2"
              />
              <span className="text-neutral-900 dark:text-white">{option}</span>
            </label>
          ))}
        </div>
        <button
          className="mt-4 w-full bg-blue-500 text-white p-2 rounded"
          onClick={onClose}
        >
          決定
        </button>
      </div>
    </div>
  );
};

export default CheckboxDialog;
