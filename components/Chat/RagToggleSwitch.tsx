import React, { useEffect, useState, useContext, FC } from 'react';
import CheckboxDialog from './RagCheckboxDialog';
import HomeContext from '@/pages/api/home/home.context';

interface Props {
  label: string;
}

const RagToggleSwitch: React.FC<Props> = ({ label}) => {
  const {
    state: {
        isRagChecked, 
        ragOptionList =[],
        selectedOptions =[],
        jwt,
        selectedConversation,
    },
    dispatch,
  } = useContext(HomeContext);



  
  const [isDialogOpen, setIsDialogOpen] = useState(false);


  const handleToggleChange = async () => {
    const newChecked = !isRagChecked;
    dispatch({ field: 'isRagChecked', value: newChecked });
    if (newChecked) {
      setIsDialogOpen(true);
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    console.log("selectedOptions;",selectedOptions);
  };

  const handleDialogAreaClick = () => {
    setIsDialogOpen(true);
  };

  return (
    <div className="flex flex-col mt-4">
      <div className="flex items-center mb-2">
        <label className="mr-2 text-left text-neutral-700 dark:text-neutral-400">
          {label}
        </label>
        <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
          <input
            type="checkbox"
            name="toggle"
            id="toggle"
            checked={isRagChecked}
            onChange={handleToggleChange}
            className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
          />
          <label
            htmlFor="toggle"
            className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"
          ></label>
        </div>
      </div>

      {selectedOptions.length > 0 && isRagChecked && (
        <div
          className="mt-2 p-2 border border-neutral-200 bg-transparent rounded-lg cursor-pointer relative dark:border-neutral-600"
          onClick={handleDialogAreaClick}
        >
          <span className="absolute top-0 left-2 transform -translate-y-1/2 bg-white px-1 text-sm text-neutral-700 dark:bg-[#343541] dark:text-neutral-400 pointer-events-none">
            タグの選択
          </span>
          {selectedOptions.map((option, index) => (
            <span
              key={index}
              className="px-3 py-1 bg-blue-500 text-white rounded-full text-sm mr-1 mt-1 inline-block"
            >
              {option}
            </span>
          ))}
        </div>
      )}

      <CheckboxDialog
        isOpen={isDialogOpen}
        onClose={handleDialogClose}
      />
    </div>
  );
};

export default RagToggleSwitch;
