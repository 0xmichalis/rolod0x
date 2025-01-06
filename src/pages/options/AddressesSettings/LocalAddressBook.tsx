import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  AlertTitle,
  Box,
  Stack,
  Accordion,
  AccordionDetails,
  CircularProgress,
} from '@mui/material';
import * as murmurhash from 'murmurhash';

import { useAddressBook } from '@src/shared/hooks/useAddressBook';

import SectionToolbar from './SectionToolbar';
import SectionHeader from './SectionHeader';
import DeleteSectionDialog from './DeleteSectionDialog';
import CodeMirrorTextAddresses from './CodeMirrorTextAddresses';

import './LocalAddressBook.css';

interface LocalAddressBookProps {
  sectionId: string;
  index: number;
}

export default function LocalAddressBook({ sectionId }: LocalAddressBookProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [fetchUrl, setFetchUrl] = useState('');
  const {
    labels,
    error,
    currentLabelsHash,
    savedLabelsHash,
    isLoaded,
    setLabels,
    setCurrentLabelsHash,
    handleSave,
    getSection,
    validate,
    title,
    updateTitle,
    deleteSection,
    url,
    updateUrl,
  } = useAddressBook(sectionId);

  useEffect(() => {
    getSection();
  }, [getSection]);

  useEffect(() => {
    const handleOptionsReset = () => {
      getSection();
    };

    window.addEventListener('options-reset', handleOptionsReset);

    return () => {
      window.removeEventListener('options-reset', handleOptionsReset);
    };
  }, [getSection]);

  // Initialize fetchUrl from storage
  useEffect(() => {
    if (url) {
      setFetchUrl(url);
    }
  }, [url]);

  const validateTimeoutRef = useRef<NodeJS.Timeout>();

  const handleLabelsChange = useCallback(
    async (newValue: string) => {
      setLabels(newValue);
      const hash = murmurhash.v3(newValue);
      setCurrentLabelsHash(hash);

      // Clear any pending validation
      if (validateTimeoutRef.current) {
        clearTimeout(validateTimeoutRef.current);
      }

      // Set new validation timeout
      validateTimeoutRef.current = setTimeout(() => {
        validate(newValue);
      }, 1000);
    },
    [setLabels, setCurrentLabelsHash, validate],
  );

  const handlePaste = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      const clipboardContents = await window.navigator.clipboard.readText();
      const hash = murmurhash.v3(clipboardContents);
      setLabels(clipboardContents);
      setCurrentLabelsHash(hash);
      validate(clipboardContents);
    },
    [setLabels, setCurrentLabelsHash, validate],
  );

  const handleRevert = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      getSection();
    },
    [getSection],
  );

  const handleSaveClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      handleSave();
    },
    [handleSave],
  );

  const labelsChanged = currentLabelsHash !== savedLabelsHash;
  const canRevert = labelsChanged;
  const canSave = !error && labelsChanged;

  const handleTitleChange = useCallback(
    (newTitle: string) => {
      if (updateTitle) {
        updateTitle(newTitle);
      }
    },
    [updateTitle],
  );

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    await deleteSection();
    setIsDeleteDialogOpen(false);
    // Trigger re-render of AddressesSettings
    window.dispatchEvent(new Event('options-reset'));
  };

  const handleDeleteCancel = () => {
    setIsDeleteDialogOpen(false);
  };

  const handleFetch = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      try {
        const response = await fetch(fetchUrl);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const content = await response.text();
        setLabels(content);
        const hash = murmurhash.v3(content);
        setCurrentLabelsHash(hash);
        validate(content);
      } catch (error) {
        console.error('Error fetching URL:', error);
        validate('Error fetching URL: ' + (error instanceof Error ? error.message : String(error)));
      }
    },
    [fetchUrl, setLabels, setCurrentLabelsHash, validate],
  );

  const handleUrlChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newUrl = e.target.value;
      setFetchUrl(newUrl);
      updateUrl(newUrl);
    },
    [updateUrl],
  );

  return isLoaded ? (
    <>
      <Accordion defaultExpanded={true}>
        <SectionHeader
          sectionId={sectionId}
          title={title}
          onTitleChange={handleTitleChange}
          onDelete={handleDeleteClick}
        />
        <AccordionDetails sx={{ ml: '40px', mt: 0 }}>
          <SectionToolbar
            fetchUrl={fetchUrl}
            onUrlChange={handleUrlChange}
            onFetch={handleFetch}
            onPaste={handlePaste}
            onRevert={handleRevert}
            onSave={handleSaveClick}
            canRevert={canRevert}
            canSave={canSave}
          />
          <Box>
            <Stack sx={{ width: '100%' }} spacing={2}>
              <Alert severity="warning" style={{ display: !error && 'none' }}>
                <AlertTitle>Error parsing address book</AlertTitle>
                {error}
              </Alert>
            </Stack>
            <CodeMirrorTextAddresses value={labels} onChange={handleLabelsChange} />
          </Box>
        </AccordionDetails>
      </Accordion>

      <DeleteSectionDialog
        open={isDeleteDialogOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
      />
    </>
  ) : (
    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
      <CircularProgress />
    </Box>
  );
}
