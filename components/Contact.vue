<!-- components/Contact.vue -->
<template>
  <div class="contact-wrapper">
    <!-- Locations Section -->
    <div class="locations-section grid-section">
      <div v-for="columnData in contactColumns" :key="columnData._uid" :class="[
        'grid-item',
        'location-column',
        getColumnClassName(columnData)
      ]">
        <div class="locations-header">
          <div v-for="location in getComponentsFromColumn(columnData, 'Locations')" :key="location._uid"
            class="image-meta">
            <h2 class="location-title" :class="getCleanLocationString(location.location)">{{ formatLocationName(location.location) }}</h2>
            
            <!-- Address block with clickable phone number -->
            <div class="address-block" v-if="location.address">
              <div v-html="formatAddress(location)" :class="getCleanLocationString(location.location)"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Team Members Section -->
    <div class="contacts-section grid-section" v-if="companyContacts.length > 0">
      <ContactCard 
        v-for="contact in companyContacts" 
        :key="contact._uid" 
        :contact="contact" 
        class="grid-item"
      />
    </div>

    <!-- Representation section -->
    <div class="representation-section grid-section representation-dynamic" v-if="displayedReps.length > 0" :style="repGridStyle">
      <StoryblokReps 
        v-for="repData in displayedReps" 
        :key="repData._uid" 
        :repData="repData" 
        :class="[
          'grid-item',
          formatClassName(repData.region)
        ]"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
interface ColumnData {
  column: any[];
  component: string;
  _uid: string;
}

interface Props {
  story: {
    content: {
      body: any[];
    };
  };
}

const props = defineProps<Props>();

// Utility functions
const formatClassName = (str: string | undefined): string => {
  if (!str) return 'representation-hide';
  return `representation-${str.toLowerCase().replace(/[\s/]+/g, '-')}`;
};

const getCleanLocationString = (str: string): string =>
  str.toLowerCase().replace(/[\s/]+/g, '-');
  
// Format location name, special case for Boston
const formatLocationName = (str: string): string => {
  if (str.toLowerCase() === 'boston') {
    return 'BOston';
  }
  return str;
};
  
// Format address block with clickable phone number and city
const formatAddress = (location: any): string => {
  if (!location || !location.address || typeof location.address !== 'string') return '';
  
  const address = location.address;
  
  try {
    // Split address into lines
    const lines = address.split('\n');
    
    // Process lines
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Skip empty lines
      if (!line || !line.trim()) continue;
      
      // Regular expression to find phone number pattern - handles various formats
      const phoneRegex = /(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/;
      const phoneMatch = line.match(phoneRegex);
      
      if (phoneMatch) {
        // Replace the phone number with a clickable link
        const phoneNumber = phoneMatch[0];
        // Clean the phone number for the href by removing non-digit characters
        const cleanPhone = phoneNumber.replace(/\D/g, '');
        
        // Make sure we have a valid phone number (10 digits for US)
        if (cleanPhone.length >= 10) {
          lines[i] = line.replace(
            phoneRegex, 
            `<a href="tel:${cleanPhone}" class="phone-link">${phoneNumber}</a>`
          );
        }
      }
      
      // Only process phone number line above, for all other address lines
      // We'll process them after the loop to create a single address link
    }
    
    // Find the phone number line index
    const phoneLineIndex = lines.findIndex((line: string) => line.includes('<a href="tel:'));
    
    // Get address lines (all except the phone line)
    const addressLines = lines.filter((_: string, idx: number) => idx !== phoneLineIndex);
    
    // Create the full address for Google Maps (fallback)
    const fullAddress = addressLines.join(', ').replace(/<br>/g, ', ');
    
    // Use mapUrl from CMS if available, otherwise construct Google Maps URL
    const mapsUrl = location.mapUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;
    
    // Wrap all address lines except phone in a clickable link
    let result = '';
    if (addressLines.length > 0) {
      // Create opening of address link
      result = `<a href="${mapsUrl}" target="_blank" class="address-link">`;
      
      // Add all address lines
      for (let i = 0; i < lines.length; i++) {
        if (i !== phoneLineIndex) {
          // Add this address line
          result += lines[i];
          
          // Add line break if it's not the last line and not before phone
          if (i < lines.length - 1 && (i + 1) !== phoneLineIndex) {
            result += '<br>';
          }
        } else if (phoneLineIndex < lines.length - 1) {
          // Close address link before phone line
          result += '</a><br>';
          // Add phone line
          result += lines[i];
        } else {
          // Phone is last line, close link and add phone
          result += '</a><br>' + lines[i];
        }
      }
      
      // Close link if it's not closed yet (when phone line was not last)
      if (phoneLineIndex === lines.length - 1 || phoneLineIndex === -1) {
        result += '</a>';
      }
    } else {
      // No address lines found, just join with breaks
      result = lines.join('<br>');
    }
    
    return result;
  } catch (error) {
    console.error('Error formatting address:', error);
    return address; // Return original address if any error occurs
  }
};

// Get location columns
const contactColumns = computed(() =>
  props.story.content.body.filter(item => item.component === 'contactColumn')
);

// Get contact reps sections (now at the top level in the JSON)
const contactReps = computed(() =>
  props.story.content.body.filter(item => item.component === 'Contact Reps')
);

// Use all reps from database
const displayedReps = computed(() => 
  contactReps.value // Dynamically shows all reps from the database
);

// Get company contacts from the new companyContact component
const companyContacts = computed(() => {
  const contactsData = props.story.content.body.find(item => item.component === 'companyContact');
  return contactsData?.contact || [];
});

// Column-specific helper functions
const getComponentsFromColumn = (columnData: ColumnData, componentType: string) =>
  columnData.column.filter(item => item.component === componentType);

// For identifying columns - no longer using column contact reps
const getColumnClassName = (columnData: ColumnData): string => {
  // Could add other column-specific class logic here
  return '';
};

// Compute dynamic grid columns for representation section
const repGridColumns = computed(() => {
  const repCount = displayedReps.value.length;
  
  // Dynamic logic based on actual data
  if (repCount === 1) return 1;
  if (repCount === 2) return 2;
  return 3; // 3 or more reps = 3 columns
});

// Style for representation grid
const repGridStyle = computed(() => ({
  gridTemplateColumns: `repeat(${repGridColumns.value}, minmax(0, 200px))`,
  '--grid-columns': repGridColumns.value
}));</script>

<style scoped lang="scss">
.contact-wrapper {
  font-weight: 700;
  text-align: center;
  
  // Define consistent grid container
  --grid-columns: 3;
  --grid-gap: 60px;
  --grid-max-width: 1200px;
  
  // Create proper spacing between sections
  & > div + div {
    margin-top: 50px;
  }

  // Base grid setup for all sections
  .grid-section {
    display: grid;
    grid-template-columns: repeat(var(--grid-columns), minmax(0, 200px));
    gap: var(--grid-gap);
    max-width: var(--grid-max-width);
    margin: 0 auto;
    padding: 0 20px;
    justify-content: center;
    
  }
  
  // Contact section alias for staging page compatibility
  .contact-section {
    @extend .grid-section;
  }

  // LOCATIONS SECTION
  .locations-section {
    @extend .grid-section;
    margin: 50px auto;
  }

  .location-title {
    &.los-angeles {
        color: var(--color-yellow) !important;
    }
    
    &.new-york {
        color: var(--color-orange) !important;
    }
    
    &.boston {
        color: var(--color-green) !important;
    }
  }

  // Grid item base styles
  .grid-item {
    text-align: center;
  }

  .location-column {
    .locations-header {
      .image-meta {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-start;

        .location-title {
          font-family: 'PS260', sans-serif;
          font-size: 30px;
          color: var(--color-white);
          margin: 0;
          margin-bottom: 8px;
          text-align: center;
          font-weight: normal;
        }
        
        .address-block {
          font-size: 13px;
          font-weight: 600;
          color: var(--color-white);
          line-height: 1.35;
          margin-bottom: 0;
          max-width: 300px;
          text-align: center;
          opacity: .2;
          transition: opacity 0.4s var(--easing-motion);
          
          :deep(.phone-link),
          :deep(.address-link) {
            color: var(--color-white);
            text-decoration: none;
            transition: color 0.4s var(--easing-motion);
          }
          
          :deep(.phone-link) {
            font-weight: 900;
            
            &:hover {
              color: var(--color-orange);
            }
          }
          
          :deep(.address-link) {
            &:hover {
              color: var(--color-white) !important;
            }
          }
        }
      }
      &:hover {
        .address-block {
          opacity: 1;
        }
      }
    }
    &:nth-child(1) {
      :deep(.phone-link:hover),
      :deep(.address-link:hover) {
        color: var(--color-yellow) !important;
      }
    }
    &:nth-child(2) {
      :deep(.phone-link:hover),
      :deep(.address-link:hover) {
        color: var(--color-orange) !important;
      }
    }
    &:nth-child(3) {
      :deep(.phone-link:hover),
      :deep(.address-link:hover) {
        color: var(--color-green) !important;
      }
    }
  }

  .company-email {
    text-align: center;
    margin-bottom: 40px;
    height: 20px;
    font-weight: 600;

    .link {
      color: var(--color-white);
      text-decoration: none;
      font-size: 14px;

      transition: color 0.4s var(--easing-motion);
      
      &:hover {
        color: var(--color-orange);
      }
    }
  }

  // CONTACTS SECTION
  .contacts-section {
    @extend .grid-section;
    margin: 50px auto;
    grid-template-columns: repeat(6, minmax(0, 70px));
    
    .grid-item {
      grid-column: span 2;
      
      // Make first card take up full row
      &:first-child {
        grid-column: 1 / -1;
        justify-self: center;
        max-width: 350px;
      }
    }
  }

  // REPRESENTATION SECTION
  .representation-section {
    @extend .grid-section;
    margin: 50px auto;
    
    // Add margin to last rep item
    .grid-item:last-child {
      margin-bottom: 50px;
    }
  }

  @include gt-cinema {
    // Extra styling for large screens if needed
  }

  @media (max-width: 1200px) {
    .contacts-section {
      .contacts-grid {
        // gap: 40px 20px;
      }
    }
  }

  @include lt-small-desktop {
    .location-column {
      .locations-header {
        .image-meta {
          img {
            max-height: 40px;
          }
        }
      }
    }
  }

  @include lt-tablet {
    margin-top: 75px;
    padding-bottom: 150px;

    // Override grid for mobile
    .grid-section {
      grid-template-columns: 1fr;
      gap: 30px;
      max-width: 300px;
    }
    
    // Hide representation items without region on mobile
    .representation-hide {
      display: none;
    }
    
    .contacts-section {
      grid-template-columns: 1fr;
      
      .grid-item {
        grid-column: 1;
        
        &:first-child {
          max-width: none;
        }
      }
    }

    .locations-section {
      
      .location-column {
        width: 100%;
        margin-bottom: 0;
        max-width: 300px;
        
        // Targeting location columns by position, making New York first
        &:nth-child(2) {
          order: -1;
        }
        
        .locations-header {
          .image-meta {
            align-items: center;
            
            .location-title {
              font-size: 28px;
              text-align: center;
            }
            
            .address-block {
              text-align: center;
              opacity: 0.75;
              margin: 0 auto;
              max-width: 300px;
            }
          }
        }
      }
    }
    
    .contacts-section {
      margin: 50px auto;
    }

    .representation-section {
      margin: 50px auto;
      
      // Force 1 column on mobile for dynamic representation
      &.representation-dynamic {
        grid-template-columns: 1fr !important;
      }
    }
    
    .rep-card:last-child {
      margin-bottom: 0;
    }

    .location-column {
      &.representation-east {
        order: -1;
      }
    }
  }
  
  // Styles for when used in contact-staging with is-wider
  .is-wider & {
    --grid-gap: 40px;
    padding: 0;

    @include gt-cinema {
      --grid-gap: 60px;
    }
    
    .grid-section {
      padding: 0;
      max-width: none;
      width: 100%;
    }
  }
}
</style>
