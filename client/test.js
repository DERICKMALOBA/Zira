const handleSubmit = async (e) => {
  e.preventDefault();
  console.log("🚀 Submit button clicked");

  const isValid = await validateForm();
  if (!isValid) {
    toast.error("Please fix the errors in the form before submitting.");
    return;
  }

  setIsSubmitting(true);

  const logError = (section, error) => {
    console.group(`❌ Error in ${section} section`);
    console.error(error.message, error);
    console.groupEnd();
    toast.error(`Error in ${section}: ${error.message}`);
  };

  try {
    // ========= 1. Upload personal images =========
    formData.passportUrl = passportFile
      ? await uploadFile(passportFile, `personal/${Date.now()}_passport.png`)
      : null;
    formData.idFrontUrl = idFrontFile
      ? await uploadFile(idFrontFile, `personal/${Date.now()}_id_front.png`)
      : null;
    formData.idBackUrl = idBackFile
      ? await uploadFile(idBackFile, `personal/${Date.now()}_id_back.png`)
      : null;
    formData.houseImageUrl = houseImageFile
      ? await uploadFile(houseImageFile, `personal/${Date.now()}_house.png`)
      : null;

    // ========= 2. Insert customer =========
    const { data: customerData, error: customerError } = await supabase
      .from("customers")
      .insert([{
        prefix: formData.prefix || null,
        Firstname: formData.Firstname || null,
        Surname: formData.Surname || null,
        Middlename: formData.Middlename || null,
        marital_status: formData.maritalStatus || null,
        residence_status: formData.residenceStatus || null,
        mobile: formData.mobile || null,
        alternative_mobile: formData.alternativeMobile || null,
        occupation: formData.occupation || null,
        date_of_birth: formData.dateOfBirth || null,
        gender: formData.gender || null,
        id_number: formData.idNumber ? parseInt(formData.idNumber) : null,
        postal_address: formData.postalAddress || null,
        code: formData.code ? parseInt(formData.code) : null,
        town: formData.town || null,
        county: formData.county || null,
        business_name: formData.businessName || null,
        business_type: formData.businessType || null,
        daily_Sales: formData.daily_Sales ? parseFloat(formData.daily_Sales) : null,
        year_established: formData.yearEstablished ? parseInt(formData.yearEstablished) : null,
        business_location: formData.businessLocation || null,
        road: formData.road || null,
        landmark: formData.landmark || null,
        has_local_authority_license: formData.hasLocalAuthorityLicense === "Yes",
        passport_url: formData.passportUrl,
        id_front_url: formData.idFrontUrl,
        id_back_url: formData.idBackUrl,
        house_image_url: formData.houseImageUrl,
      }])
      .select("id")
      .single();

    if (customerError) {
      logError("Customer", customerError);
      setIsSubmitting(false);
      return;
    }

    const customerId = customerData.id;

    // ========= 3. Upload business images =========
    if (businessImages.length > 0) {
      const businessImageUrls = [];
      for (const image of businessImages) {
        const url = await uploadFile(image, `business/${Date.now()}_${image.name}`);
        if (url) businessImageUrls.push(url);
      }
      if (businessImageUrls.length > 0) {
        const { error: businessImageError } = await supabase
          .from("business_images")
          .insert(businessImageUrls.map((url) => ({ customer_id: customerId, image_url: url })));
        if (businessImageError) logError("Business Images", businessImageError);
      }
    }

    // ========= 4. Upload borrower security images =========
    for (let i = 0; i < securityItemImages.length; i++) {
      const urls = [];
      for (const image of securityItemImages[i]) {
        const url = await uploadFile(image, `security/${Date.now()}_${image.name}`);
        if (url) urls.push(url);
      }
      if (urls.length > 0) {
        const { error: secImgError } = await supabase
          .from("security_item_images")
          .insert(urls.map((url) => ({ customer_id: customerId, item_index: i, image_url: url })));
        if (secImgError) logError("Borrower Security Images", secImgError);
      }
    }

    // ========= 5. Upload guarantor images =========
    const guarantorUrls = {
      passport: guarantorPassportFile ? await uploadFile(guarantorPassportFile, `guarantor/${Date.now()}_passport.png`) : null,
      idFront: guarantorIdFrontFile ? await uploadFile(guarantorIdFrontFile, `guarantor/${Date.now()}_id_front.png`) : null,
      idBack: guarantorIdBackFile ? await uploadFile(guarantorIdBackFile, `guarantor/${Date.now()}_id_back.png`) : null,
    };

    // Save guarantor + guarantor images
    const { error: guarantorError } = await supabase.from("guarantors").insert([{
      customer_id: customerId,
      Firstname: formData.guarantor.Firstname || null,
      Surname: formData.guarantor.Surname || null,
      Middlename: formData.guarantor.Middlename || null,
      id_number: formData.guarantor.idNumber || null,
      marital_status: formData.guarantor.maritalStatus || null,
      date_of_birth: formData.guarantor.dateOfBirth || null,
      gender: formData.guarantor.gender || null,
      mobile: formData.guarantor.mobile || null,
      occupation: formData.guarantor.occupation || null,
      relationship: formData.guarantor.relationship || null,
      county: formData.guarantor.county || null,
      city_town: formData.guarantor.cityTow || null,
      postal_address: formData.guarantor.postalAddress || null,
      code: formData.guarantor.code || null,
      passport_url: guarantorUrls.passport,
      id_front_url: guarantorUrls.idFront,
      id_back_url: guarantorUrls.idBack,
    }]);

    if (guarantorError) logError("Guarantor", guarantorError);

    // ========= 6. Guarantor Security Images =========
    for (let i = 0; i < guarantorSecurityImages.length; i++) {
      const urls = [];
      for (const image of guarantorSecurityImages[i]) {
        const url = await uploadFile(image, `guarantor_security/${Date.now()}_${image.name}`);
        if (url) urls.push(url);
      }
      if (urls.length > 0) {
        const { error: guarSecImgError } = await supabase
          .from("guarantor_security_images")
          .insert(urls.map((url) => ({ customer_id: customerId, item_index: i, image_url: url })));
        if (guarSecImgError) logError("Guarantor Security Images", guarSecImgError);
      }
    }

    // ========= 7. Officer & client images =========
    const officer1Url = officerClientImage1 ? await uploadFile(officerClientImage1, `officers/${Date.now()}_officer1.png`) : null;
    const officer2Url = officerClientImage2 ? await uploadFile(officerClientImage2, `officers/${Date.now()}_officer2.png`) : null;
    const bothOfficersUrl = bothOfficersImage ? await uploadFile(bothOfficersImage, `officers/${Date.now()}_both.png`) : null;

    const { error: officerError } = await supabase.from("customers").insert([{
      customer_id: customerId,
      officer_client_img1: officer1Url,
      officer_client_img2: officer2Url,
      both_officers_img: bothOfficersUrl,
    }]);
    if (officerError) logError("Officer Documents", officerError);

    // ========= 8. Next of Kin =========
    const nextOfKin = formData.nextOfKin || {};
    const nextOfKinFilled = Object.values(nextOfKin).some((val) => val != null && String(val).trim() !== "");
    if (nextOfKinFilled) {
      const { error: nextOfKinError } = await supabase.from("next_of_kin").insert([{
        customer_id: customerId,
        Firstname: nextOfKin.Firstname || null,
        Surname: nextOfKin.Surname || null,
        Middlename: nextOfKin.Middlename || null,
        id_number: nextOfKin.idNumber || null,
        relationship: nextOfKin.relationship || null,
        mobile: nextOfKin.mobile || null,
        alternative_number: nextOfKin.alternativeNumber || null,
        employment_status: nextOfKin.employmentStatus || null,
        county: nextOfKin.county || null,
        cityTown: nextOfKin.cityTown || null,
      }]);
      if (nextOfKinError) logError("Next of Kin", nextOfKinError);
    }

    toast.success("✅ Customer added successfully with all images!");
  } catch (err) {
    console.error("Unexpected error:", err);
    toast.error("Unexpected error while submitting form.");
  } finally {
    setIsSubmitting(false);
  }
};