import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Container, 
  Title, 
  Text, 
  Button, 
  Stack, 
  Group,
  Paper,
  TextInput,
  Textarea,
  Alert,
  Badge,
  Divider
} from '@mantine/core';
import { IconArrowLeft, IconArrowRight, IconInfoCircle, IconCheck } from '@tabler/icons-react';

export function PortfolioDetailsInputPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [titleError, setTitleError] = useState('');
  const [descriptionError, setDescriptionError] = useState('');

  // Get data from navigation state
  const { file, columnMappings, mappedData } = location.state || {};

  useEffect(() => {
    if (!file || !columnMappings || !mappedData) {
      navigate('/portfolio/import');
      return;
    }
  }, [file, columnMappings, mappedData, navigate]);

  const validateTitle = (value: string): boolean => {
    const trimmedValue = value.trim();
    
    if (!trimmedValue) {
      setTitleError('Portfolio title is required');
      return false;
    }
    if (trimmedValue.length < 3) {
      setTitleError('Portfolio title must be at least 3 characters');
      return false;
    }
    if (trimmedValue.length > 100) {
      setTitleError('Portfolio title must be less than 100 characters');
      return false;
    }
    
    setTitleError('');
    return true;
  };

  const validateDescription = (value: string): boolean => {
    const trimmedValue = value.trim();
    
    if (trimmedValue.length > 500) {
      setDescriptionError('Description must be less than 500 characters');
      return false;
    }
    
    setDescriptionError('');
    return true;
  };

  const handleTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = event.currentTarget.value;
    setTitle(newTitle);
    validateTitle(newTitle);
  };

  const handleDescriptionChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newDescription = event.currentTarget.value;
    setDescription(newDescription);
    validateDescription(newDescription);
  };

  const handleNext = () => {
    const isTitleValid = validateTitle(title);
    const isDescriptionValid = validateDescription(description);
    
    if (!isTitleValid || !isDescriptionValid) {
      return;
    }

    // Navigate to step 5 (final review) with all data
    navigate('/portfolio/import/final-review', {
      state: {
        file,
        columnMappings,
        mappedData,
        portfolioTitle: title.trim(),
        portfolioDescription: description.trim() || undefined,
        step: 5
      }
    });
  };

  const handleBack = () => {
    navigate('/portfolio/import/review', {
      state: {
        file,
        columnMappings,
        mappedData,
        step: 3
      }
    });
  };

  const isValid = title.trim().length > 0 && !titleError && !descriptionError;
  const validRowCount = mappedData?.filter((row: any) => row._isValid).length || 0;
  const invalidRowCount = mappedData?.filter((row: any) => !row._isValid).length || 0;

  if (!file || !columnMappings || !mappedData) {
    return null;
  }

  return (
    <Container size="md" py="xl">
      <Stack gap="lg">
        <div>
          <Title order={1} mb="sm">Import Portfolio</Title>
          <Text color="dimmed" size="lg">
            Step 4 of 5: Portfolio Details
          </Text>
        </div>

        <Paper withBorder p="xl" radius="md">
          <Stack gap="md">
            <div>
              <Title order={3}>Portfolio Information</Title>
              <Text size="sm" color="dimmed">
                Provide details about your portfolio
              </Text>
            </div>

            <Alert 
              icon={<IconInfoCircle size={16} />} 
              title="Import Summary"
              color="blue"
              variant="light"
            >
              <Group gap="md">
                <Badge color="green" variant="light">
                  {validRowCount} valid properties
                </Badge>
                {invalidRowCount > 0 && (
                  <Badge color="red" variant="light">
                    {invalidRowCount} invalid properties
                  </Badge>
                )}
              </Group>
              <Text size="sm" mt="xs">
                Ready to import {validRowCount} valid properties from {file.name}
              </Text>
            </Alert>

            <Divider />

            <TextInput
              label="Portfolio Title"
              placeholder="Enter portfolio title"
              value={title}
              onChange={handleTitleChange}
              error={titleError}
              required
              description="A descriptive name for your portfolio"
              rightSection={
                title.trim().length >= 3 && !titleError ? (
                  <IconCheck size={16} color="green" />
                ) : null
              }
            />

            <Textarea
              label="Portfolio Description"
              placeholder="Enter portfolio description (optional)"
              value={description}
              onChange={handleDescriptionChange}
              error={descriptionError}
              description={`Additional details about this portfolio (${description.length}/500 characters)`}
              minRows={3}
              maxRows={6}
            />

            <Paper withBorder p="md" radius="sm" bg="gray.0">
              <Stack gap="xs">
                <Text size="sm" fw={500}>Requirements:</Text>
                <Text size="xs" color="dimmed">
                  • Portfolio title is required (3-100 characters)
                </Text>
                <Text size="xs" color="dimmed">
                  • Description is optional (max 500 characters)
                </Text>
                <Text size="xs" color="dimmed">
                  • Only valid properties will be imported
                </Text>
              </Stack>
            </Paper>
          </Stack>
        </Paper>

        <Group justify="space-between">
          <Button 
            onClick={handleBack}
            variant="outline"
            leftSection={<IconArrowLeft size={16} />}
          >
            Back
          </Button>
          <Button 
            onClick={handleNext}
            disabled={!isValid}
            leftSection={<IconArrowRight size={16} />}
            color={isValid ? 'blue' : 'gray'}
          >
            Next: Final Review
          </Button>
        </Group>
      </Stack>
    </Container>
  );
}