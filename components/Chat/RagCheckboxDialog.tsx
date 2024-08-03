import React, { useState } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  selectedOptions: string[];
  onSelectionChange: (options: string[]) => void;
}

const CheckboxDialog: React.FC<Props> = ({
  isOpen,
  onClose,
  selectedOptions,
  onSelectionChange,
}) => {
  const fruitOptions = [
    { label: 'りんご', value: 'apple' },
    { label: 'バナナ', value: 'banana' },
    { label: 'メロン', value: 'melon' },
  ];

  const handleCheckboxChange = (value: string) => {
    const newSelectedOptions = selectedOptions.includes(value)
      ? selectedOptions.filter(option => option !== value)
      : [...selectedOptions, value];
    onSelectionChange(newSelectedOptions);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-[#343541] rounded-lg p-6 w-80 relative">
        <h2 className="text-lg font-bold mb-4 text-neutral-900 dark:text-white">RAGのタグを選択</h2>
        <div className="flex flex-col">
          {fruitOptions.map(option => (
            <label key={option.value} className="flex items-center mb-2">
              <input
                type="checkbox"
                checked={selectedOptions.includes(option.value)}
                onChange={() => handleCheckboxChange(option.value)}
                className="mr-2"
              />
              <span className="text-neutral-900 dark:text-white">{option.label}</span>
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
